<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class EnsureCustomerVerified {
    public function handle(Request $request, Closure $next) {
        if (!$request->user()?->email_verified_at) return response()->json(['message' => 'Please verify your email to continue.'], 403);
        return $next($request);
    }
}
