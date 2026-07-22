<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAuthToken;
use App\Models\CustomerOauthState;
use App\Models\CustomerSocialAccount;
use App\Services\CustomerOrderLinkService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class CustomerGoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        if (!config('services.google.client_id') || !config('services.google.client_secret') || !config('services.google.redirect')) {
            return response()->json(['message' => 'Google sign-in is not configured.'], 503);
        }

        $plain = bin2hex(random_bytes(32));
        CustomerOauthState::create([
            'state_hash' => hash('sha256', $plain),
            'flow' => 'login',
            'expires_at' => now()->addMinutes(10),
        ]);

        return response()->json([
            'url' => Socialite::driver('google')
                ->stateless()
                ->scopes(['openid', 'profile', 'email'])
                ->with(['state' => $plain, 'prompt' => 'select_account'])
                ->redirect()
                ->getTargetUrl(),
        ]);
    }

    public function callback(Request $request, CustomerOrderLinkService $linker)
    {
        $state = CustomerOauthState::where('state_hash', hash('sha256', (string) $request->state))
            ->where('expires_at', '>', now())
            ->first();

        if (!$state) {
            return $this->front('oauth_error=invalid_state');
        }
        $state->delete();

        try {
            $google = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            report($e);
            return $this->front('oauth_error=provider_failed');
        }

        $email = strtolower(trim((string) $google->getEmail()));
        $verified = (bool) ($google->user['verified_email'] ?? $google->user['email_verified'] ?? false);
        if (!$email || !$verified) {
            return $this->front('oauth_error=verified_email_required');
        }

        $providerUserId = (string) $google->getId();
        $customer = DB::transaction(function () use ($google, $email, $providerUserId) {
            $social = CustomerSocialAccount::with('customer')
                ->where('provider', 'google')
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($social) {
                $customer = $social->customer;
                $customer->forceFill([
                    'name' => $google->getName() ?: $customer->name,
                    'avatar_url' => $google->getAvatar() ?: $customer->avatar_url,
                    'email_verified_at' => $customer->email_verified_at ?: now(),
                    'last_login_at' => now(),
                ])->save();

                $social->forceFill(['provider_email' => $email])->save();
                return $customer->refresh();
            }

            $customer = Customer::whereRaw('LOWER(email) = ?', [$email])->first();

            if (!$customer) {
                $customer = Customer::create([
                    'name' => $google->getName() ?: Str::before($email, '@'),
                    'username' => $this->uniqueUsername($email),
                    'email' => $email,
                    'email_verified_at' => now(),
                    'avatar_url' => $google->getAvatar(),
                    'status' => 'active',
                    'last_login_at' => now(),
                ]);
            } else {
                if (!$customer->isActive()) {
                    return $customer;
                }

                $updates = [
                    'email_verified_at' => $customer->email_verified_at ?: now(),
                    'last_login_at' => now(),
                ];
                if (!$customer->username) {
                    $updates['username'] = $this->uniqueUsername($email, $customer->id);
                }
                if (!$customer->name && $google->getName()) {
                    $updates['name'] = $google->getName();
                }
                if (!$customer->avatar_url && $google->getAvatar()) {
                    $updates['avatar_url'] = $google->getAvatar();
                }
                $customer->forceFill($updates)->save();
            }

            $customer->socialAccounts()->firstOrCreate(
                ['provider' => 'google', 'provider_user_id' => $providerUserId],
                ['provider_email' => $email]
            );

            return $customer->refresh();
        });

        if (!$customer->isActive()) {
            return $this->front('oauth_error=account_unavailable');
        }

        $linker->linkVerifiedEmail($customer, $request);

        $code = bin2hex(random_bytes(32));
        CustomerAuthToken::create([
            'customer_id' => $customer->id,
            'purpose' => 'oauth_exchange',
            'token_hash' => hash('sha256', $code),
            'expires_at' => now()->addMinutes(5),
        ]);

        return $this->front('code=' . $code);
    }

    public function exchange(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $token = CustomerAuthToken::with('customer')
            ->where('purpose', 'oauth_exchange')
            ->where('token_hash', hash('sha256', $data['code']))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$token) {
            return response()->json(['message' => 'This Google sign-in code is invalid or expired.'], 422);
        }

        $token->forceFill(['used_at' => now()])->save();
        $customer = $token->customer;

        SecurityAudit::record($request, 'customer.login', 'success', null, 'customer', $customer->id, [
            'customer_id' => $customer->id,
            'provider' => 'google',
        ]);

        return response()->json([
            'token' => $customer->createToken('customer', ['customer'])->plainTextToken,
            'customer' => $customer->fresh(),
        ]);
    }

    private function uniqueUsername(string $email, ?int $ignoreCustomerId = null): string
    {
        $base = Str::lower(Str::before($email, '@'));
        $base = preg_replace('/[^a-z0-9._-]+/', '', $base) ?: 'customer';
        $base = Str::limit($base, 24, '');
        if (strlen($base) < 3) {
            $base = str_pad($base, 3, '0');
        }

        $candidate = $base;
        $suffix = 1;
        while (Customer::where('username', $candidate)
            ->when($ignoreCustomerId, fn ($query) => $query->where('id', '!=', $ignoreCustomerId))
            ->exists()) {
            $candidate = Str::limit($base, 20, '') . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function front(string $query)
    {
        return redirect(rtrim((string) config('services.customer_app_url'), '/') . '/auth/google/callback?' . $query);
    }
}
