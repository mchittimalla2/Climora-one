<?php
namespace App\Contracts;
interface CustomerPhoneVerificationProvider {
    public function configured(): bool;
    public function sendChallenge(string $e164Phone, string $plainCode): void;
}
