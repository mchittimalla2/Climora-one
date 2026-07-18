<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index()
    {
        return response()->json(
            Order::with('items')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'regex:/^[0-9]{10}
$/'],
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
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        try {
            $order = DB::transaction(function () use ($validated) {
                $preparedItems = [];
                $calculatedTotal = 0;

                foreach ($validated['items'] as $requestedItem) {
                    $product = Product::query()
                        ->lockForUpdate()
                        ->findOrFail($requestedItem['product_id']);

                    $quantity = (int) $requestedItem['quantity'];
                    $availableStock = (int) $product->stock;

                    if ($availableStock < $quantity) {
                        throw new \RuntimeException(
                            "Only {$availableStock} item(s) are available for {$product->name}."
                        );
                    }

                    $unitPrice = (float) $product->price;
                    $subtotal = round($unitPrice * $quantity, 2);

                    $preparedItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                    ];

                    $calculatedTotal += $subtotal;
                }

                $calculatedTotal = round($calculatedTotal, 2);

                $order = Order::create([
                    'order_number' => sprintf(
                        'CLM-%s-%s',
                        now()->format('Y'),
                        strtoupper(uniqid())
                    ),
                    'customer_name' => $validated['customer_name'],
                    'email' => strtolower($validated['email']),
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'city' => $validated['city'],
                    'state' => $validated['state'],
                    'pincode' => $validated['pincode'],
                    'total' => $calculatedTotal,
                    'status' => 'Order Received',
                    'status_history' => json_encode([
                        'Order Received' => now()->toDateTimeString(),
                    ]),
                    'payment_status' => 'Pending',
                ]);

                foreach ($preparedItems as $preparedItem) {
                    $product = $preparedItem['product'];

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $preparedItem['quantity'],
                        'price' => $preparedItem['unit_price'],
                        'subtotal' => $preparedItem['subtotal'],
                    ]);

                    $product->decrement(
                        'stock',
                        $preparedItem['quantity']
                    );
                }

                return $order->load('items');
            }, 3);

            return response()->json([
                'message' => 'Order created successfully.',
                'order' => $order,
            ], 201);
        } catch (\RuntimeException $error) {
            return response()->json([
                'message' => $error->getMessage(),
            ], 409);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Unable to place the order. Please try again.',
            ], 500);
        }
    }

    public function track(Request $request)
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:40', 'regex:/^CLM-[A-Z0-9-]+$/'],
            'phone' => ['required', 'regex:/^[0-9]{10}$/'],
        ]);

        $order = Order::with('items')
            ->where('order_number', $validated['order_number'])
            ->where('phone', $validated['phone'])
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found'
            ], 404);
        }

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'status_history' => $order->status_history,
            'created_at' => $order->created_at,
            'items' => $order->items->map(fn ($item) => [
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
            ]),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['Order Received', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'])],
        ]);

        $order = Order::where('order_number', $id)->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found'
            ], 404);
        }

        $previousStatus = $order->status;
        $history = $order->status_history
            ? json_decode($order->status_history, true)
            : [];

        $history[$validated['status']] = now()->toDateTimeString();

        $order->status = $validated['status'];
        $order->status_history = json_encode($history);
        $order->save();
        SecurityAudit::record($request, 'admin.order_status_update', 'success', null, 'order', $order->id, [
            'order_number' => $order->order_number,
            'before' => ['status' => $previousStatus],
            'after' => ['status' => $order->status],
        ]);

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order->load('items')
        ]);
    }
}
