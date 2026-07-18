<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminEmailChangeRequest;
use App\Support\SecurityAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class AdminProfileController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $before = $user->only(['name', 'username']);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'username' => [
                'required', 'string', 'min:3', 'max:50',
                'regex:/^[a-zA-Z0-9._-]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
        ]);

        $user->forceFill([
            'name' => trim($validated['name']),
            'username' => Str::lower(trim($validated['username'])),
        ])->save();
        SecurityAudit::record($request, 'profile.update', 'success', $user, 'user', $user->id,
            SecurityAudit::changes($before, $user->fresh()->toArray(), ['name', 'username'])
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->safeUser($user->fresh()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ])->save();

        $user->adminSessions()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        $user->tokens()->delete();

        SecurityAudit::record($request, 'profile.password_change', 'success', $user, 'user', $user->id);
        return response()->json(['message' => 'Password changed successfully. Sign in again with your new password.']);
    }

    public function requestEmailChange(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'new_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['required', 'string'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        $newEmail = Str::lower(trim($validated['new_email']));
        $rateKey = 'admin-email-change:' . $user->id;

        if (RateLimiter::tooManyAttempts($rateKey, 1)) {
            return response()->json([
                'message' => 'Please wait before requesting another email-change code.',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ], 429);
        }

        RateLimiter::hit($rateKey, 60);

        AdminEmailChangeRequest::where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $otp = (string) random_int(100000, 999999);
        AdminEmailChangeRequest::create([
            'user_id' => $user->id,
            'new_email' => $newEmail,
            'code_hash' => Hash::make($otp),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
            'requested_ip' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
        ]);

        try {
            $response = Http::withHeaders([
                'api-key' => config('services.brevo.api_key'),
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])->timeout(15)->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => ['email' => config('services.brevo.from_email'), 'name' => config('services.brevo.from_name')],
                'to' => [['email' => $newEmail, 'name' => $user->name]],
                'subject' => 'Confirm your new Climoraone admin email',
                'htmlContent' => '<p>Hello ' . e($user->name) . ',</p><p>Your verification code is:</p><h1 style="letter-spacing:8px">' . e($otp) . '</h1><p>This code expires in 10 minutes.</p>',
                'textContent' => "Your Climoraone email-change code is {$otp}. It expires in 10 minutes.",
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Brevo rejected the email-change message.');
            }
        } catch (Throwable $exception) {
            report(new \RuntimeException('Unable to deliver email-change OTP.', 0, $exception));
            throw ValidationException::withMessages(['new_email' => ['The verification email could not be delivered.']]);
        }

        SecurityAudit::record($request, 'profile.email_change_requested', 'success', $user, 'user', $user->id, [
            'new_email_hash' => hash('sha256', $newEmail),
        ]);
        return response()->json([
            'message' => 'A verification code was sent to the new email address.',
            'expires_in' => 600,
        ]);
    }

    public function verifyEmailChange(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'new_email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);

        $newEmail = Str::lower(trim($validated['new_email']));
        $change = AdminEmailChangeRequest::where('user_id', $user->id)
            ->where('new_email', $newEmail)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (!$change || !$change->isUsable() || !Hash::check($validated['otp'], $change->code_hash)) {
            if ($change) $change->increment('attempts');
            throw ValidationException::withMessages(['otp' => ['The verification code is invalid or expired.']]);
        }

        if (\App\Models\User::where('email', $newEmail)->where('id', '!=', $user->id)->exists()) {
            throw ValidationException::withMessages(['new_email' => ['This email address is already in use.']]);
        }

        $change->forceFill(['consumed_at' => now()])->save();
        $user->forceFill(['email' => $newEmail, 'email_verified_at' => now()])->save();

        $user->adminSessions()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        $user->tokens()->delete();

        SecurityAudit::record($request, 'profile.email_change', 'success', $user, 'user', $user->id, [
            'email_hash' => hash('sha256', $newEmail),
        ]);
        return response()->json([
            'message' => 'Email address updated successfully. Sign in again with your new email.',
            'user' => $this->safeUser($user->fresh()),
        ]);
    }

    private function safeUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'is_break_glass' => $user->isBreakGlass(),
            'mfa_enabled' => $user->mfa_enabled,
        ];
    }
}
