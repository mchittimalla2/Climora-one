<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminOtpCode;
use App\Models\AdminSession;
use App\Support\SecurityAudit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AdminAuthController extends Controller
{
    private const OTP_PURPOSE = 'admin_login';
    private const OTP_EXPIRY_MINUTES = 5;
    private const OTP_MAX_ATTEMPTS = 5;
    private const PASSWORD_MAX_ATTEMPTS = 5;
    private const LOCK_MINUTES = 15;
    private const RESEND_SECONDS = 60;

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $email = Str::lower(trim($credentials['email']));
        $rateKey = 'admin-login:' . $request->ip() . ':' . hash('sha256', $email);

        if (RateLimiter::tooManyAttempts($rateKey, self::PASSWORD_MAX_ATTEMPTS)) {
            return response()->json([
                'message' => 'Too many login attempts. Please try again later.',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ], 429);
        }

        /** @var User|null $user */
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($rateKey, self::LOCK_MINUTES * 60);
            $this->recordAudit($request, $user, 'auth.login.failure', 'failure');

            if ($user) {
                $attempts = $user->failed_login_attempts + 1;
                $updates = ['failed_login_attempts' => $attempts];

                if ($attempts >= self::PASSWORD_MAX_ATTEMPTS) {
                    $updates['locked_until'] = now()->addMinutes(self::LOCK_MINUTES);
                }

                $user->forceFill($updates)->save();
            }

            throw ValidationException::withMessages([
                'email' => ['The supplied credentials are invalid.'],
            ]);
        }

        if (!$user->is_active || $user->isLocked()) {
            $this->recordAudit($request, $user, 'auth.login.failure', 'failure');

            return response()->json([
                'message' => 'This account is unavailable or temporarily locked.',
            ], 423);
        }

        if (!$user->mfa_enabled) {
            $this->recordAudit($request, $user, 'auth.login.failure', 'failure');

            return response()->json([
                'message' => 'Multi-factor authentication is required for this account.',
            ], 403);
        }

        RateLimiter::clear($rateKey);
        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        $this->issueAndSendOtp($request, $user);
        $this->recordAudit($request, $user, 'auth.otp.sent', 'success');

        return response()->json([
            'message' => 'A verification code was sent to your registered email address.',
            'requires_otp' => true,
            'expires_in' => self::OTP_EXPIRY_MINUTES * 60,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);

        $email = Str::lower(trim($data['email']));
        $rateKey = 'admin-otp-verify:' . $request->ip() . ':' . hash('sha256', $email);

        if (RateLimiter::tooManyAttempts($rateKey, self::OTP_MAX_ATTEMPTS)) {
            return response()->json([
                'message' => 'Too many verification attempts. Start a new login.',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ], 429);
        }

        /** @var User|null $user */
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user || !$user->is_active || $user->isLocked()) {
            RateLimiter::hit($rateKey, self::LOCK_MINUTES * 60);
            $this->recordAudit($request, $user, 'auth.otp.failure', 'failure');

            throw ValidationException::withMessages([
                'otp' => ['The verification code is invalid or expired.'],
            ]);
        }

        /** @var AdminOtpCode|null $otp */
        $otp = AdminOtpCode::where('user_id', $user->id)
            ->where('purpose', self::OTP_PURPOSE)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (!$otp || !$otp->isUsable() || !Hash::check($data['otp'], $otp->code_hash)) {
            RateLimiter::hit($rateKey, self::LOCK_MINUTES * 60);

            if ($otp) {
                $otp->increment('attempts');
            }

            $this->recordAudit($request, $user, 'auth.otp.failure', 'failure');

            throw ValidationException::withMessages([
                'otp' => ['The verification code is invalid or expired.'],
            ]);
        }

        $otp->forceFill(['consumed_at' => now()])->save();
        RateLimiter::clear($rateKey);

        // Every successful login receives a fresh token. Old tokens are revoked.
        $user->adminSessions()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        $user->tokens()->delete();
        $token = $user->createToken('admin-web', ['admin'])->plainTextToken;
        $session = AdminSession::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            'mfa_verified_at' => now(),
            'last_activity_at' => now(),
            'expires_at' => now()->addHours(8),
        ]);
        $request->attributes->set('admin_session', $session);

        $user->forceFill([
            'last_login_at' => now(),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        $this->recordAudit($request, $user, 'auth.otp.success', 'success');
        $this->recordAudit($request, $user, 'auth.login.success', 'success');

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->safeUser($user),
        ]);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $email = Str::lower(trim($credentials['email']));
        $rateKey = 'admin-otp-resend:' . $request->ip() . ':' . hash('sha256', $email);

        if (RateLimiter::tooManyAttempts($rateKey, 1)) {
            return response()->json([
                'message' => 'Please wait before requesting another code.',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ], 429);
        }

        /** @var User|null $user */
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password) || !$user->is_active || $user->isLocked()) {
            $this->recordAudit($request, $user, 'auth.otp.resend_failure', 'failure');

            throw ValidationException::withMessages([
                'email' => ['The request could not be completed.'],
            ]);
        }

        RateLimiter::hit($rateKey, self::RESEND_SECONDS);
        $this->issueAndSendOtp($request, $user);
        $this->recordAudit($request, $user, 'auth.otp.resent', 'success');

        return response()->json([
            'message' => 'A new verification code was sent.',
            'expires_in' => self::OTP_EXPIRY_MINUTES * 60,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->safeUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $session = $request->attributes->get('admin_session');
        $this->recordAudit($request, $user, 'auth.logout', 'success');
        $session?->forceFill(['revoked_at' => now()])->save();
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    private function issueAndSendOtp(Request $request, User $user): void
    {
        AdminOtpCode::where('user_id', $user->id)
            ->where('purpose', self::OTP_PURPOSE)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $plainOtp = (string) random_int(100000, 999999);

        AdminOtpCode::create([
            'user_id' => $user->id,
            'purpose' => self::OTP_PURPOSE,
            'code_hash' => Hash::make($plainOtp),
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'attempts' => 0,
            'requested_ip' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
        ]);

        try {
            $response = Http::withHeaders([
                'api-key' => config('services.brevo.api_key'),
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])->timeout(15)->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'email' => config('services.brevo.from_email'),
                    'name' => config('services.brevo.from_name'),
                ],
                'to' => [[
                    'email' => $user->email,
                    'name' => $user->name,
                ]],
                'subject' => 'Your Climoraone security code',
                'htmlContent' => $this->otpEmailHtml($user, $plainOtp),
                'textContent' => "Your Climoraone security code is {$plainOtp}. It expires in 5 minutes. If you did not request this code, change your password and contact the owner.",
                'headers' => [
                    'X-Climoraone-Message-Type' => 'admin-login-otp',
                ],
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Brevo rejected the transactional email request.');
            }
        } catch (Throwable $exception) {
            // Never log the OTP or API response body.
            report(new \RuntimeException('Unable to deliver admin login OTP.', 0, $exception));

            throw ValidationException::withMessages([
                'email' => ['The verification email could not be delivered. Please try again.'],
            ]);
        }
    }

    private function otpEmailHtml(User $user, string $otp): string
    {
        $name = e($user->name);
        $code = e($otp);

        return <<<HTML
<!doctype html>
<html lang="en">
<body style="margin:0;background:#f6f1e8;font-family:Arial,sans-serif;color:#183f2b;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e5dccd;border-radius:16px;padding:32px;">
    <div style="font-size:24px;font-weight:700;margin-bottom:20px;">Climoraone</div>
    <p>Hello {$name},</p>
    <p>Use the following one-time code to complete your admin login:</p>
    <div style="font-size:36px;letter-spacing:10px;font-weight:700;text-align:center;padding:20px;margin:24px 0;background:#f6f1e8;border-radius:12px;">{$code}</div>
    <p>This code expires in 5 minutes and can be used only once.</p>
    <p style="font-size:13px;color:#68756e;">If you did not attempt to sign in, do not share this code. Change your password and contact the Climoraone owner.</p>
  </div>
</body>
</html>
HTML;
    }

    private function safeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_break_glass' => $user->isBreakGlass(),
            'mfa_enabled' => $user->mfa_enabled,
        ];
    }

    private function recordAudit(Request $request, ?User $user, string $event, string $result): void
    {
        SecurityAudit::record($request, $event, $result, $user, 'authentication', null, [
            'email_hash' => hash('sha256', Str::lower((string) $request->input('email'))),
        ]);
    }
}
