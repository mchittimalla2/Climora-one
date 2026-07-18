<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Models\Product;
use App\Services\PaymentProcessor;
use App\Services\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(
        private RazorpayService $razorpay,
        private PaymentProcessor $processor
    ) {
    }

    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'regex:/^[0-9]{10}$/'],
            'address' => ['required', 'string', 'min:5', 'max:500'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['required', 'digits:6'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'id')->whereNull('deleted_at'),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        try {
            $order = DB::transaction(function () use ($validated) {
                $preparedItems = [];
                $total = 0;

                foreach ($validated['items'] as $requestedItem) {
                    $product = Product::query()->lockForUpdate()->findOrFail($requestedItem['product_id']);
                    $quantity = (int) $requestedItem['quantity'];

                    if ((int) $product->stock < $quantity) {
                        throw new RuntimeException("Only {$product->stock} item(s) are available for {$product->name}.");
                    }

                    $unitPrice = (float) $product->price;
                    $subtotal = round($unitPrice * $quantity, 2);
                    $total += $subtotal;
                    $preparedItems[] = compact('product', 'quantity', 'unitPrice', 'subtotal');
                }

                $order = Order::create([
                    'order_number' => sprintf('CLM-%s-%s', now()->format('Y'), strtoupper(uniqid())),
                    'customer_name' => $validated['customer_name'],
                    'email' => strtolower($validated['email']),
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'city' => $validated['city'],
                    'state' => $validated['state'],
                    'pincode' => $validated['pincode'],
                    'total' => round($total, 2),
                    'status' => 'Pending Payment',
                    'status_history' => json_encode(['Pending Payment' => now()->toDateTimeString()]),
                    'payment_status' => 'Pending',
                ]);

                foreach ($preparedItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product']->id,
                        'product_name' => $item['product']->name,
                        'quantity' => $item['quantity'],
                        'price' => $item['unitPrice'],
                        'subtotal' => $item['subtotal'],
                    ]);
                }

                return $order->load('items');
            }, 3);

            $amount = (int) round(((float) $order->total) * 100);
            $providerOrder = $this->razorpay->createOrder($amount, $order->order_number, [
                'internal_order_number' => $order->order_number,
            ]);

            Payment::create([
                'order_id' => $order->id,
                'provider_order_id' => $providerOrder['id'],
                'amount' => $amount,
                'currency' => $providerOrder['currency'] ?? 'INR',
                'status' => $providerOrder['status'] ?? 'created',
                'gateway_response' => [
                    'id' => $providerOrder['id'],
                    'amount' => $providerOrder['amount'],
                    'currency' => $providerOrder['currency'],
                    'receipt' => $providerOrder['receipt'] ?? null,
                    'status' => $providerOrder['status'] ?? null,
                ],
            ]);

            return response()->json([
                'key_id' => $this->razorpay->keyId(),
                'razorpay_order_id' => $providerOrder['id'],
                'amount' => $amount,
                'currency' => $providerOrder['currency'] ?? 'INR',
                'order' => $order,
            ], 201);
        } catch (RuntimeException $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        } catch (Throwable $error) {
            report($error);
            return response()->json(['message' => 'Unable to start payment. Please try again.'], 500);
        }
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string'],
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        $payment = Payment::where('provider_order_id', $validated['razorpay_order_id'])
            ->whereHas('order', fn ($query) => $query->where('order_number', $validated['order_number']))
            ->first();

        if (!$payment) {
            return response()->json(['message' => 'Payment record was not found.'], 404);
        }

        if (!$this->razorpay->verifyCheckoutSignature(
            $payment->provider_order_id,
            $validated['razorpay_payment_id'],
            $validated['razorpay_signature']
        )) {
            $payment->forceFill(['status' => 'signature_failed', 'signature_verified' => false])->save();
            return response()->json(['message' => 'Payment signature verification failed.'], 422);
        }

        try {
            $gatewayPayment = $this->razorpay->fetchPayment($validated['razorpay_payment_id']);
            $payment->forceFill([
                'provider_payment_id' => $validated['razorpay_payment_id'],
                'signature_verified' => true,
            ])->save();

            $confirmed = $this->processor->confirmCapturedPayment($payment, $gatewayPayment);

            return response()->json([
                'message' => 'Payment verified and order confirmed.',
                'order' => $confirmed->order,
            ]);
        } catch (RuntimeException $error) {
            $payment->forceFill([
                'status' => 'captured_review',
                'failure_description' => $error->getMessage(),
            ])->save();

            return response()->json([
                'message' => $error->getMessage(),
                'requires_review' => true,
            ], 409);
        } catch (Throwable $error) {
            report($error);
            return response()->json(['message' => 'Payment verification could not be completed.'], 500);
        }
    }

    public function cancel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string'],
            'razorpay_order_id' => ['required', 'string'],
        ]);

        $payment = Payment::where('provider_order_id', $validated['razorpay_order_id'])
            ->whereHas('order', fn ($query) => $query->where('order_number', $validated['order_number']))
            ->first();

        if ($payment && !in_array($payment->status, ['captured', 'paid'], true)) {
            $payment->forceFill(['status' => 'cancelled'])->save();
            $payment->order->forceFill([
                'payment_status' => 'Cancelled',
                'status' => 'Payment Cancelled',
            ])->save();
        }

        return response()->json(['message' => 'Payment cancellation recorded.']);
    }

    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = (string) $request->header('X-Razorpay-Signature');

        if (!$this->razorpay->verifyWebhookSignature($rawBody, $signature)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        $payload = json_decode($rawBody, true) ?: [];
        $eventType = (string) ($payload['event'] ?? 'unknown');
        $eventId = (string) ($request->header('X-Razorpay-Event-Id') ?: hash('sha256', $rawBody));
        $gatewayPayment = data_get($payload, 'payload.payment.entity', []);
        $providerOrderId = $gatewayPayment['order_id'] ?? data_get($payload, 'payload.order.entity.id');
        $payment = $providerOrderId ? Payment::where('provider_order_id', $providerOrderId)->first() : null;

        $event = PaymentEvent::firstOrCreate(
            ['provider_event_id' => $eventId],
            [
                'payment_id' => $payment?->id,
                'event_type' => $eventType,
                'payload' => $payload,
                'processing_status' => 'received',
            ]
        );

        if ($event->processing_status === 'processed') {
            return response()->json(['message' => 'Webhook already processed.']);
        }

        try {
            if ($payment && in_array($eventType, ['payment.captured', 'order.paid'], true)) {
                if (!$gatewayPayment && $payment->provider_payment_id) {
                    $gatewayPayment = $this->razorpay->fetchPayment($payment->provider_payment_id);
                }

                if ($gatewayPayment) {
                    $payment->forceFill([
                        'provider_payment_id' => $gatewayPayment['id'] ?? $payment->provider_payment_id,
                        'last_webhook_at' => now(),
                    ])->save();
                    $this->processor->confirmCapturedPayment($payment, $gatewayPayment);
                }
            } elseif ($payment && $eventType === 'payment.failed') {
                $this->processor->markFailed($payment, $gatewayPayment);
            }

            $event->forceFill([
                'payment_id' => $payment?->id,
                'processing_status' => 'processed',
                'processed_at' => now(),
                'processing_error' => null,
            ])->save();

            return response()->json(['message' => 'Webhook processed.']);
        } catch (Throwable $error) {
            report($error);
            $event->forceFill([
                'processing_status' => 'failed',
                'processing_error' => mb_substr($error->getMessage(), 0, 2000),
            ])->save();

            return response()->json(['message' => 'Webhook processing failed.'], 500);
        }
    }
}
