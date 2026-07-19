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
            $this->customerTemplate(
                $order,
                'Order confirmed',
                'Your payment was successful and your order is now being prepared with care.',
                '4–6 business days'
            )
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
            $this->customerTemplate(
                $order,
                'Out for delivery',
                'Your order is on the way and should reach you soon.',
                'Arriving soon'
            )
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
            $this->customerTemplate(
                $order,
                'Order delivered',
                'Your order has been delivered. We hope you love your handcrafted piece.',
                'Delivered'
            )
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

    private function customerTemplate(Order $order, string $statusTitle, string $message, string $deliveryEstimate): string
    {
        $order->loadMissing(['items', 'payment']);
        $storeUrl = $this->storeUrl();
        $trackUrl = $storeUrl . '/track-order';
        $logoUrl = $storeUrl . '/images/climoraone-logo.svg';
        $items = $this->itemsTable($order);
        $paymentMethod = $order->payment?->method ?: 'Online payment';

        $body = '
            <p style="margin:0 0 8px;color:#b6873d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">' . e($statusTitle) . '</p>
            <h1 style="margin:0 0 14px;color:#173f2a;font-family:Georgia,serif;font-size:30px;line-height:1.2;">Hello ' . e($order->customer_name) . ',</h1>
            <p style="margin:0 0 24px;color:#505850;font-size:16px;line-height:1.7;">' . e($message) . '</p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;border-collapse:separate;border-spacing:10px 0;">
                <tr>
                    <td style="width:50%;padding:16px;border:1px solid #e4dfd3;border-radius:12px;background:#fbf8f1;">
                        <span style="display:block;margin-bottom:6px;color:#7a8079;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Order number</span>
                        <strong style="color:#173f2a;font-size:15px;">' . e($order->order_number) . '</strong>
                    </td>
                    <td style="width:50%;padding:16px;border:1px solid #e4dfd3;border-radius:12px;background:#fbf8f1;">
                        <span style="display:block;margin-bottom:6px;color:#7a8079;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Estimated delivery</span>
                        <strong style="color:#173f2a;font-size:15px;">' . e($deliveryEstimate) . '</strong>
                    </td>
                </tr>
            </table>

            <h2 style="margin:0 0 12px;color:#173f2a;font-family:Georgia,serif;font-size:22px;">Order summary</h2>
            ' . $items . '

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 24px;border-collapse:collapse;">
                <tr>
                    <td style="padding:10px 0;color:#666f67;font-size:14px;">Payment</td>
                    <td align="right" style="padding:10px 0;color:#173f2a;font-size:14px;font-weight:700;">' . e($paymentMethod) . '</td>
                </tr>
                <tr>
                    <td style="padding:14px 0;border-top:1px solid #ded8cc;color:#173f2a;font-size:17px;font-weight:700;">Total paid</td>
                    <td align="right" style="padding:14px 0;border-top:1px solid #ded8cc;color:#173f2a;font-size:20px;font-weight:800;">₹' . e(number_format((float) $order->total, 2)) . '</td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 26px;">
                <tr>
                    <td align="center" bgcolor="#173f2a" style="border-radius:999px;">
                        <a href="' . e($trackUrl) . '" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Track your order</a>
                    </td>
                </tr>
            </table>

            <div style="padding:20px;border:1px solid #d7b97e;border-radius:14px;background:#f8f2e7;text-align:center;">
                <p style="margin:0 0 6px;color:#173f2a;font-family:Georgia,serif;font-size:19px;font-weight:700;">Every purchase empowers our partners.</p>
                <p style="margin:0;color:#5b625b;font-size:13px;line-height:1.6;">Your order supports rural women, skilled artisans and meaningful livelihoods while helping preserve traditional craftsmanship.</p>
            </div>';

        return $this->emailShell($body, $logoUrl, 'Thank you for choosing handmade with purpose.');
    }

    private function adminTemplate(Order $order): string
    {
        $order->loadMissing(['items', 'payment']);
        $storeUrl = $this->storeUrl();
        $logoUrl = $storeUrl . '/images/climoraone-logo.svg';
        $items = $this->itemsTable($order);

        $body = '
            <p style="margin:0 0 8px;color:#b6873d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">New paid order</p>
            <h1 style="margin:0 0 20px;color:#173f2a;font-family:Georgia,serif;font-size:30px;">Order ' . e($order->order_number) . '</h1>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:collapse;border:1px solid #e4dfd3;border-radius:12px;background:#fbf8f1;">
                <tr><td style="padding:9px 16px;color:#747b74;font-size:13px;">Customer</td><td style="padding:9px 16px;color:#173f2a;font-weight:700;">' . e($order->customer_name) . '</td></tr>
                <tr><td style="padding:9px 16px;color:#747b74;font-size:13px;">Email</td><td style="padding:9px 16px;color:#173f2a;font-weight:700;">' . e($order->email) . '</td></tr>
                <tr><td style="padding:9px 16px;color:#747b74;font-size:13px;">Phone</td><td style="padding:9px 16px;color:#173f2a;font-weight:700;">' . e($order->phone) . '</td></tr>
                <tr><td style="padding:9px 16px;color:#747b74;font-size:13px;">Delivery</td><td style="padding:9px 16px;color:#173f2a;font-weight:700;">' . e($order->address . ', ' . $order->city . ', ' . $order->state . ' - ' . $order->pincode) . '</td></tr>
            </table>

            <h2 style="margin:0 0 12px;color:#173f2a;font-family:Georgia,serif;font-size:22px;">Items ordered</h2>
            ' . $items . '

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-collapse:collapse;">
                <tr>
                    <td style="padding:14px 0;border-top:1px solid #ded8cc;color:#173f2a;font-size:17px;font-weight:700;">Order total</td>
                    <td align="right" style="padding:14px 0;border-top:1px solid #ded8cc;color:#173f2a;font-size:20px;font-weight:800;">₹' . e(number_format((float) $order->total, 2)) . '</td>
                </tr>
            </table>';

        return $this->emailShell($body, $logoUrl, 'A paid order is ready for processing.');
    }

    private function itemsTable(Order $order): string
    {
        $rows = '';

        foreach ($order->items as $item) {
            $subtotal = $item->subtotal ?? ((float) $item->price * (int) $item->quantity);
            $rows .= '
                <tr>
                    <td style="padding:13px 0;border-bottom:1px solid #ece7dc;">
                        <strong style="display:block;color:#173f2a;font-size:14px;line-height:1.4;">' . e($item->product_name) . '</strong>
                        <span style="color:#747b74;font-size:12px;">Qty ' . e((string) $item->quantity) . ' × ₹' . e(number_format((float) $item->price, 2)) . '</span>
                    </td>
                    <td align="right" style="padding:13px 0;border-bottom:1px solid #ece7dc;color:#173f2a;font-size:14px;font-weight:700;">₹' . e(number_format((float) $subtotal, 2)) . '</td>
                </tr>';
        }

        if ($rows === '') {
            $rows = '<tr><td style="padding:14px 0;color:#747b74;">Order item details are unavailable.</td></tr>';
        }

        return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">' . $rows . '</table>';
    }

    private function emailShell(string $body, string $logoUrl, string $footerMessage): string
    {
        return '<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5ede3;font-family:Arial,Helvetica,sans-serif;color:#1f2f22;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5ede3;">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:separate;background:#ffffff;border:1px solid #e2dbcf;border-radius:20px;overflow:hidden;box-shadow:0 16px 46px rgba(31,61,43,.12);">
                    <tr>
                        <td align="center" style="padding:24px 30px;background:#ffffff;border-bottom:4px solid #b6873d;">
                            <img src="' . e($logoUrl) . '" width="230" alt="Climoraone" style="display:block;width:230px;max-width:80%;height:auto;border:0;">
                        </td>
                    </tr>
                    <tr><td style="padding:34px 34px 28px;">' . $body . '</td></tr>
                    <tr>
                        <td style="padding:22px 30px;background:#173f2a;text-align:center;">
                            <p style="margin:0 0 6px;color:#d7b97e;font-family:Georgia,serif;font-size:17px;font-weight:700;">Climoraone</p>
                            <p style="margin:0;color:rgba(255,255,255,.78);font-size:12px;line-height:1.6;">' . e($footerMessage) . '</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }

    private function storeUrl(): string
    {
        return rtrim((string) config('services.storefront.url', 'https://dev.climoraone.com'), '/');
    }
}
