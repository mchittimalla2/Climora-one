<?php
namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;

class CustomerRecommendationService
{
    public function for(Customer $customer, int $limit = 6)
    {
        $paidOrders = $customer->orders()->where('payment_status', 'Paid')->with('items.product')->get();
        $bought = $paidOrders->flatMap->items->pluck('product_id')->filter()->unique();
        $categories = $paidOrders->flatMap->items->map(fn ($item) => $item->product?->category)->filter()->unique();
        $base = Product::query()->where('stock', '>', 0);
        $suggested = (clone $base)->when($categories->isNotEmpty(), fn ($q) => $q->whereIn('category', $categories))->whereNotIn('id', $bought)->latest()->limit($limit)->get();
        if ($suggested->count() < $limit) $suggested = $suggested->concat((clone $base)->whereNotIn('id', $suggested->pluck('id')->merge($bought))->latest()->limit($limit - $suggested->count())->get());

        return $suggested->values()->map(function (Product $product) {
            $paths = array_values(array_filter($product->images ?: array_filter([$product->main_image])));
            $urls = array_map(fn ($path) => Storage::disk('public')->url($path), $paths);
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'price' => $product->price,
                'stock' => $product->stock,
                'main_image' => $urls[0] ?? null,
                'images' => $urls,
            ];
        });
    }
}
