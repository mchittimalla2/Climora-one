<?php

namespace App\Services;

use App\Models\EmailNotification;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Throwable;

class OrderEmailService
{
    public function sendCustomerOrderConfirmed(Order $order): void
    {
        $this->sendOnce(
            $order,
            'customer.order_confirmed',
            $order->email,
            'customer',
            "Your Climoraone order {$order->order_number} is confirmed",
            $this->customerTemplate($order, 'Your payment was successful and your order is confirmed.')
        );
    }

    public function sendCustomerOutForDelivery(Order $order): void
    {
        $this->sendOnce(
            $order,
            'customer.out_for_delivery',
            $order->email,
            'customer',
            "Your Climoraone order {$order->order_number} is out for delivery",
            $this->customerTemplate($order, 'Your order is now out for delivery.')
        );
    }

    public function sendCustomerDelivered(Order $order): void
    {
        $this->sendOnce(
            $order,
            'customer.delivered',
            $order->email,
            'customer',
            "Your Climoraone order {$order->order_number} was delivered",
            $this->customerTemplate($order, 'Your order has been delivered. Thank you for shopping with Climoraone.')
        );
    }

    public function sendAdminNewPaidOrder(Order $order): void
    {
        $adminEmail = (string) config('services.brevo.admin_email');
        if ($adminEmail === '') {
            return;
        }

        $this->sendOnce(
            $order,
            'admin.new_paid_order',
            $adminEmail,
            'admin',
            "New paid order {$order->order_number}",
            $this->adminTemplate($order)
        );
    }

    private function sendOnce(Order $order, string $eventType, string $recipient, string $recipientType, string $subject, string $html): void
    {
        $notification = EmailNotification::firstOrCreate(
            [
                'order_id' => $order->id,
                'event_type' => $eventType,
                'recipient_email' => strtolower($recipient),
            ],
            [
                'recipient_type' => $recipientType,
                'status' => 'pending',
            ]
        );

        if ($notification->status === 'sent') {
            return;
        }

        $notification->increment('attempts');

        try {
            $response = Http::withHeaders([
                'api-key' => (string) config('services.brevo.api_key'),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'name' => config('services.brevo.from_name', 'Climoraone'),
                    'email' => config('services.brevo.from_email', 'info@climoraone.com'),
                ],
                'to' => [[
                    'email' => $recipient,
                    'name' => $recipientType === 'customer' ? $order->customer_name : 'Climoraone Admin',
                ]],
                'subject' => $subject,
                'htmlContent' => $html,
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException($response->body());
            }

            $notification->forceFill([
                'status' => 'sent',
                'provider_message_id' => $response->json('messageId'),
                'last_error' => null,
                'sent_at' => now(),
            ])->save();
        } catch (Throwable $error) {
            report($error);
            $notification->forceFill([
                'status' => 'failed',
                'last_error' => mb_substr($error->getMessage(), 0, 2000),
            ])->save();
        }
    }

    private function customerTemplate(Order $order, string $message): string
    {
        return '<h2>Climoraone</h2>'
            . '<p>Hello ' . e($order->customer_name) . ',</p>'
            . '<p>' . e($message) . '</p>'
            . '<p><strong>Order:</strong> ' . e($order->order_number) . '<br>'
            . '<strong>Total:</strong> ₹' . e(number_format((float) $order->total, 2)) . '</p>'
            . '<p>We will continue to keep you updated.</p>';
    }

    private function adminTemplate(Order $order): string
    {
        return '<h2>New paid Climoraone order</h2>'
            . '<p><strong>Order:</strong> ' . e($order->order_number) . '</p>'
            . '<p><strong>Customer:</strong> ' . e($order->customer_name) . '<br>'
            . '<strong>Email:</strong> ' . e($order->email) . '<br>'
            . '<strong>Phone:</strong> ' . e($order->phone) . '<br>'
            . '<strong>Total:</strong> ₹' . e(number_format((float) $order->total, 2)) . '</p>';
    }
}
