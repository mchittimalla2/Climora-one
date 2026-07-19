<?php
namespace App\Services;

use App\Models\Customer;
use App\Models\Product;

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
        return $suggested->values();
    }
}
