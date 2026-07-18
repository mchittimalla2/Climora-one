<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RazorpayService
{
    private string $keyId;
    private string $keySecret;

    public function __construct()
    {
        $this->keyId = (string) config('services.razorpay.key_id');
        $this->keySecret = (string) config('services.razorpay.key_secret');

        if ($this->keyId === '' || $this->keySecret === '') {
            throw new RuntimeException('Razorpay credentials are not configured.');
        }
    }

    public function createOrder(int $amount, string $receipt, array $notes = []): array
    {
        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $amount,
                'currency' => config('services.razorpay.currency', 'INR'),
                'receipt' => $receipt,
                'notes' => $notes,
            ]);

        if (!$response->successful()) {
            throw new RuntimeException($response->json('error.description') ?: 'Unable to create Razorpay order.');
        }

        return $response->json();
    }

    public function fetchPayment(string $paymentId): array
    {
        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->acceptJson()
            ->get("https://api.razorpay.com/v1/payments/{$paymentId}");

        if (!$response->successful()) {
            throw new RuntimeException($response->json('error.description') ?: 'Unable to fetch Razorpay payment.');
        }

        return $response->json();
    }

    public function verifyCheckoutSignature(string $providerOrderId, string $paymentId, string $signature): bool
    {
        $expected = hash_hmac('sha256', $providerOrderId . '|' . $paymentId, $this->keySecret);

        return hash_equals($expected, $signature);
    }

    public function verifyWebhookSignature(string $rawBody, string $signature): bool
    {
        $secret = (string) config('services.razorpay.webhook_secret');
        if ($secret === '') {
            return false;
        }

        return hash_equals(hash_hmac('sha256', $rawBody, $secret), $signature);
    }

    public function keyId(): string
    {
        return $this->keyId;
    }
}
