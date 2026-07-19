<?php
namespace App\Services;
use App\Contracts\CustomerPhoneVerificationProvider;
use RuntimeException;
class NullCustomerPhoneVerificationProvider implements CustomerPhoneVerificationProvider {
    public function configured(): bool { return false; }
    public function sendChallenge(string $e164Phone, string $plainCode): void { throw new RuntimeException('Mobile verification is not configured.'); }
}
