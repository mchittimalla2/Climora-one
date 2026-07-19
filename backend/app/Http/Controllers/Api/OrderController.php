<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\InvoiceAccessService;
use App\Services\OrderEmailService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index()
    {
        return response()->json(
            Order::with(['items', 'payment'])->latest()->get()
        );
    }

    public function store(Request $request)
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
                $calculatedTotal = 0;

                foreach ($validated['items'] as $requestedItem) {
                    $product = Product::query()->lockForUpdate()->findOrFail($requestedItem['product_id']);
                    $quantity = (int) $requestedItem['quantity'];
                    $availableStock = (int) $product->stock;

                    if ($availableStock < $quantity) {
                        throw new \RuntimeException("Only {$availableStock} item(s) are available for {$product->name}.");
                    }

                    $unitPrice = (float) $product->price;
                    $subtotal = round($unitPrice * $quantity, 2);
                    $preparedItems[] = compact('product', 'quantity', 'unitPrice', 'subtotal');
                    $calculatedTotal += $subtotal;
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
                    'total' => round($calculatedTotal, 2),
                    'status' => 'Order Received',
                    'status_history' => json_encode(['Order Received' => now()->toDateTimeString()]),
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
                    $item['product']->decrement('stock', $item['quantity']);
                }

                return $order->load('items');
            }, 3);

            return response()->json(['message' => 'Order created successfully.', 'order' => $order], 201);
        } catch (\RuntimeException $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        } catch (\Throwable $error) {
            report($error);
            return response()->json(['message' => 'Unable to place the order. Please try again.'], 500);
        }
    }

    public function track(Request $request, InvoiceAccessService $invoiceAccess)
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:40', 'regex:/^CLM-[A-Z0-9-]+$/'],
            'phone' => ['required', 'regex:/^[0-9]{10}$/'],
        ]);

        $order = Order::with(['items', 'payment'])
            ->where('order_number', strtoupper($validated['order_number']))
            ->where('phone', $validated['phone'])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $paymentVerified = $order->payment_status === 'Paid'
            && $order->payment
            && $order->payment->status === 'captured'
            && $order->payment->verified_at
            && $order->payment->provider_payment_id;
        $invoice = $paymentVerified ? $order->invoice()->first() : null;
        $invoiceAvailable = $invoice
            && Storage::disk($invoice->disk)->exists($invoice->file_path);
        $invoiceDownloadUrl = $invoiceAvailable
            ? $invoiceAccess->createDownloadUrl($invoice)
            : null;

        return response()->json([
            'order_number' => $order->order_number,
            'customer_name' => $order->customer_name,
            'email' => $order->email,
            'phone' => $order->phone,
            'total' => $order->total,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment?->method,
            'status_history' => $order->status_history,
            'created_at' => $order->created_at,
            'has_invoice' => (bool) $invoiceAvailable,
            'invoice_download_url' => $invoiceDownloadUrl,
            'invoice_file_name' => $invoiceAvailable ? $invoice->file_name : null,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'price' => $item->price,
                'subtotal' => $item->subtotal,
            ])->values(),
        ]);
    }

    public function updateStatus(Request $request, $id, OrderEmailService $emails)
    {
        $lifecycle = ['Order Received', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

        $validated = $request->validate([
            'status' => ['required', Rule::in([...$lifecycle, 'Cancelled'])],
        ]);

        $order = Order::where('order_number', $id)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $aliases = [
            'Item Packed' => 'Packed',
            'Out For Delivery' => 'Out for Delivery',
            'Completed' => 'Delivered',
            'Pending Payment' => 'Order Received',
        ];

        $currentStatus = $aliases[$order->status] ?? $order->status;
        $requestedStatus = $validated['status'];

        if (in_array($requestedStatus, ['Out for Delivery', 'Delivered'], true)) {
            $order->loadMissing(['payment', 'invoice']);
            $invoice = $order->invoice;
            $eligibleForCustomerEmail = $order->payment_status === 'Paid'
                && $order->payment
                && $order->payment->status === 'captured'
                && $order->payment->verified_at
                && $order->payment->provider_payment_id
                && $invoice
                && Storage::disk($invoice->disk)->exists($invoice->file_path);

            if (!$eligibleForCustomerEmail) {
                return response()->json([
                    'message' => 'This milestone requires a verified paid order with an available invoice.',
                ], 422);
            }
        }

        if ($currentStatus === 'Delivered') {
            return response()->json([
                'message' => 'This order is already delivered and its lifecycle cannot be changed.',
            ], 409);
        }

        if ($requestedStatus !== 'Cancelled') {
            $currentIndex = array_search($currentStatus, $lifecycle, true);
            $requestedIndex = array_search($requestedStatus, $lifecycle, true);

            if ($currentIndex === false || $requestedIndex === false) {
                return response()->json(['message' => 'The current order status is invalid. Refresh the page and try again.'], 409);
            }

            if ($requestedIndex !== $currentIndex + 1) {
                return response()->json([
                    'message' => 'Order milestones must be completed in sequence. Complete the next available milestone only.',
                ], 409);
            }
        }

        $previousStatus = $order->status;
        $history = $order->status_history ? json_decode($order->status_history, true) : [];
        $history[$requestedStatus] = now()->toDateTimeString();

        $order->forceFill([
            'status' => $requestedStatus,
            'status_history' => json_encode($history),
        ])->save();

        SecurityAudit::record($request, 'admin.order_status_update', 'success', null, 'order', $order->id, [
            'order_number' => $order->order_number,
            'before' => ['status' => $previousStatus],
            'after' => ['status' => $order->status],
        ]);

        if ($order->status === 'Out for Delivery') {
            $emails->sendCustomerOutForDelivery($order);
        } elseif ($order->status === 'Delivered') {
            $emails->sendCustomerDelivered($order);
        }

        return response()->json([
            'message' => 'Order milestone completed successfully.',
            'order' => $order->load(['items', 'payment']),
        ]);
    }
}
