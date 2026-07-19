<?php
namespace App\Http\Middleware;
use App\Models\Customer;
use Closure;
use Illuminate\Http\Request;
class EnsureCustomerActive {
    public function handle(Request $request, Closure $next) {
        $customer = $request->user();
        if (!$customer instanceof Customer || !$customer->tokenCan('customer')) return response()->json(['message' => 'Customer access is required.'], 403);
        if (!$customer->isActive()) return response()->json(['message' => 'This customer account is unavailable.'], 403);
        return $next($request);
    }
}
