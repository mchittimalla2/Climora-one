<?php
namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerAuthToken;

class CustomerTokenService
{
    public function issue(Customer $customer, string $purpose, int $minutes, ?string $pendingEmail = null): string
    {
        $plain = bin2hex(random_bytes(32));
        CustomerAuthToken::where('customer_id', $customer->id)->where('purpose', $purpose)->whereNull('used_at')->update(['used_at' => now()]);
        CustomerAuthToken::create(['customer_id' => $customer->id, 'purpose' => $purpose, 'token_hash' => hash('sha256', $plain), 'pending_email' => $pendingEmail, 'expires_at' => now()->addMinutes($minutes)]);
        return $plain;
    }

    public function consume(string $plain, string $purpose): ?CustomerAuthToken
    {
        if (!preg_match('/^[a-f0-9]{64}$/', $plain)) return null;
        $token = CustomerAuthToken::with('customer')->where('token_hash', hash('sha256', $plain))->where('purpose', $purpose)->where('expires_at', '>', now())->first();
        if ($token && $token->used_at) return $purpose === 'verify_email' && $token->customer?->email_verified_at ? $token : null;
        if ($token) $token->forceFill(['used_at' => now()])->save();
        return $token;
    }
}
