<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

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
            'customer_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'address' => 'required|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'pincode' => 'nullable|string',
            'total' => 'required|numeric',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
        ]);

        try {
            $order = DB::transaction(function () use ($validated) {
                foreach ($validated['items'] as $item) {
                    $product = Product::lockForUpdate()->find($item['product_id']);

                    if (!$product) {
                        throw new \Exception("Product not found: " . $item['product_name']);
                    }

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception(
                            "Only {$product->stock} quantity available for {$product->name}."
                        );
                    }
                }

                $order = Order::create([
                    'order_number' => 'CLM-' . date('Y') . '-' . time(),
                    'customer_name' => $validated['customer_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'city' => $validated['city'] ?? '',
                    'state' => $validated['state'] ?? '',
                    'pincode' => $validated['pincode'] ?? '',
                    'total' => $validated['total'],
                    'status' => 'Order Received',
                    'status_history' => json_encode([
                        'Order Received' => now()->toDateTimeString()
                    ]),
                    'payment_status' => 'Pending',
                ]);

                foreach ($validated['items'] as $item) {
                    $product = Product::lockForUpdate()->find($item['product_id']);

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $item['quantity'] * $item['price'],
                    ]);

                    $product->stock = $product->stock - $item['quantity'];
                    $product->save();
                }

                return $order->load('items');
            });

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order
            ], 201);
        } catch (\Exception $error) {
            return response()->json([
                'message' => $error->getMessage()
            ], 422);
        }
    }

    public function track(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|string',
            'phone' => 'required|string',
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

        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string',
        ]);

        $order = Order::where('order_number', $id)->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found'
            ], 404);
        }

        $history = $order->status_history
            ? json_decode($order->status_history, true)
            : [];

        $history[$validated['status']] = now()->toDateTimeString();

        $order->status = $validated['status'];
        $order->status_history = json_encode($history);
        $order->save();

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order->load('items')
        ]);
    }
}