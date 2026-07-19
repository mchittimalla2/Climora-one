<?php
namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\Http;
use Throwable;

class CustomerEmailService
{
    public function verification(Customer $customer, string $url): void { $this->send($customer, 'Verify your Climoraone account', 'Verify your email', 'Confirm your email to securely access your order history.', $url, 'Verify email'); }
    public function verificationTo(Customer $customer, string $email, string $url): void { $recipient = clone $customer; $recipient->email = $email; $this->verification($recipient, $url); }
    public function welcome(Customer $customer): void { $this->send($customer, 'Welcome to Climoraone', 'Welcome to Climoraone', 'Your email is verified and your account is ready.'); }
    public function passwordReset(Customer $customer, string $url): void { $this->send($customer, 'Reset your Climoraone password', 'Reset your password', 'This secure link expires in 30 minutes.', $url, 'Reset password'); }
    public function passwordChanged(Customer $customer): void { $this->send($customer, 'Your Climoraone password was changed', 'Password changed', 'Your account password was changed. If this was not you, contact support immediately.'); }
    public function emailChanged(Customer $customer): void { $this->send($customer, 'Your Climoraone email was changed', 'Email changed', 'Your account email address has been updated.'); }

    private function send(Customer $customer, string $subject, string $heading, string $copy, ?string $url = null, ?string $label = null): void
    {
        try {
            $body = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#26362c"><h1 style="font-family:Georgia,serif;color:#173f2a">'.e($heading).'</h1><p style="line-height:1.7">'.e($copy).'</p>'.($url ? '<p><a style="display:inline-block;padding:12px 22px;background:#173f2a;color:#fff;text-decoration:none;border-radius:999px" href="'.e($url).'">'.e($label).'</a></p>' : '').'<p style="color:#697169">Climoraone · Every purchase empowers our partners.</p></div>';
            $response = Http::withHeaders(['api-key' => (string) config('services.brevo.api_key'), 'Content-Type' => 'application/json'])->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => ['name' => config('services.brevo.from_name', 'Climoraone'), 'email' => config('services.brevo.from_email', 'info@climoraone.com')],
                'to' => [['email' => $customer->email, 'name' => $customer->name]], 'subject' => $subject, 'htmlContent' => $body,
            ]);
            if (!$response->successful()) throw new \RuntimeException('Customer email delivery failed.');
        } catch (Throwable $error) { report($error); }
    }
}
