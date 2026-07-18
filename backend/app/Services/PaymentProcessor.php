<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PaymentProcessor
{
    public function __construct(private OrderEmailService $emails)
    {
    }

    public function confirmCapturedPayment(Payment $payment, array $gatewayPayment): Payment
    {
        $confirmed = DB::transaction(function () use ($payment, $gatewayPayment) {
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $order = $lockedPayment->order()->with('items')->lockForUpdate()->firstOrFail();

            if ($lockedPayment->inventory_processed && $order->payment_status === 'Paid') {
                return $lockedPayment->load('order.items');
            }

            if (($gatewayPayment['status'] ?? null) !== 'captured') {
                throw new RuntimeException('Payment is not captured yet.');
            }

            if ((int) ($gatewayPayment['amount'] ?? 0) !== (int) $lockedPayment->amount) {
                throw new RuntimeException('Captured payment amount does not match the order amount.');
            }

            if (($gatewayPayment['order_id'] ?? null) !== $lockedPayment->provider_order_id) {
                throw new RuntimeException('Razorpay order ID does not match the internal payment record.');
            }

            foreach ($order->items as $item) {
                $product = Product::query()->lockForUpdate()->find($item->product_id);

                if (!$product) {
                    throw new RuntimeException("Product {$item->product_name} is no longer available. Manual review is required.");
                }

                if ((int) $product->stock < (int) $item->quantity) {
                    throw new RuntimeException("Insufficient stock for {$item->product_name}. Manual review is required.");
                }

                $product->decrement('stock', (int) $item->quantity);
            }

            $history = $order->status_history
                ? json_decode($order->status_history, true)
                : [];
            $history['Confirmed'] = now()->toDateTimeString();

            $order->forceFill([
                'payment_status' => 'Paid',
                'status' => 'Confirmed',
                'status_history' => json_encode($history),
            ])->save();

            $lockedPayment->forceFill([
                'provider_payment_id' => $gatewayPayment['id'] ?? $lockedPayment->provider_payment_id,
                'status' => 'captured',
                'method' => $gatewayPayment['method'] ?? null,
                'inventory_processed' => true,
                'gateway_response' => $this->sanitizedGatewayResponse($gatewayPayment),
                'captured_at' => isset($gatewayPayment['captured_at'])
                    ? now()->setTimestamp((int) $gatewayPayment['captured_at'])
                    : now(),
                'verified_at' => now(),
                'failure_code' => null,
                'failure_description' => null,
            ])->save();

            return $lockedPayment->load('order.items');
        }, 3);

        $this->emails->sendCustomerOrderConfirmed($confirmed->order);
        $this->emails->sendAdminNewPaidOrder($confirmed->order);

        return $confirmed;
    }

    public function markFailed(Payment $payment, array $gatewayPayment): void
    {
        $payment->forceFill([
            'provider_payment_id' => $gatewayPayment['id'] ?? $payment->provider_payment_id,
            'status' => 'failed',
            'method' => $gatewayPayment['method'] ?? null,
            'failure_code' => $gatewayPayment['error_code'] ?? null,
            'failure_description' => $gatewayPayment['error_description'] ?? null,
            'gateway_response' => $this->sanitizedGatewayResponse($gatewayPayment),
            'last_webhook_at' => now(),
        ])->save();

        $payment->order->forceFill([
            'payment_status' => 'Failed',
            'status' => 'Payment Failed',
        ])->save();
    }

    private function sanitizedGatewayResponse(array $payment): array
    {
        return collect($payment)->only([
            'id',
            'entity',
            'amount',
            'currency',
            'status',
            'order_id',
            'invoice_id',
            'international',
            'method',
            'amount_refunded',
            'refund_status',
            'captured',
            'description',
            'email',
            'contact',
            'fee',
            'tax',
            'error_code',
            'error_description',
            'error_source',
            'error_step',
            'error_reason',
            'created_at',
        ])->all();
    }
}
