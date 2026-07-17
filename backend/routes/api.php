<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminAuthController;

Route::options('/{any}', function () {
    return response('', 204)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
})->where('any', '.*');

/*
|--------------------------------------------------------------------------
| Public storefront APIs
|--------------------------------------------------------------------------
*/
Route::get('/products', [ProductController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/track-order', [OrderController::class, 'track']);

/*
|--------------------------------------------------------------------------
| Admin authentication
|--------------------------------------------------------------------------
| The sender is info@climoraone.com. The OTP recipient is always the
| personal email stored on the authenticated User record.
*/
Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    Route::post('/verify-otp', [AdminAuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AdminAuthController::class, 'resendOtp']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected admin APIs
|--------------------------------------------------------------------------
| Product writes, order visibility and order-status changes are never public.
*/
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
