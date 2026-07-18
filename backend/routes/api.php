<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminIdentifierAuthController;
use App\Http\Controllers\Api\AdminProfileController;

Route::get('/products', [ProductController::class, 'index']);
Route::post('/payments/create-order', [PaymentController::class, 'createOrder'])->middleware('throttle:checkout');
Route::post('/payments/verify', [PaymentController::class, 'verify'])->middleware('throttle:checkout');
Route::post('/payments/cancel', [PaymentController::class, 'cancel'])->middleware('throttle:checkout');
Route::post('/razorpay/webhook', [PaymentController::class, 'webhook']);
Route::post('/track-order', [OrderController::class, 'track'])->middleware('throttle:order-track');

Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [AdminIdentifierAuthController::class, 'login'])->middleware('throttle:admin-auth');
    Route::post('/verify-otp', [AdminIdentifierAuthController::class, 'verifyOtp'])->middleware('throttle:admin-auth');
    Route::post('/resend-otp', [AdminIdentifierAuthController::class, 'resendOtp'])->middleware('throttle:admin-auth');

    Route::middleware(['auth:sanctum', 'admin.session', 'admin.access'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
    });
});

Route::prefix('admin')->middleware(['auth:sanctum', 'admin.session', 'admin.access'])->group(function () {
    Route::put('/profile', [AdminProfileController::class, 'updateProfile']);
    Route::middleware('reauth.recent')->group(function () {
        Route::put('/profile/password', [AdminProfileController::class, 'changePassword']);
        Route::post('/profile/email-change', [AdminProfileController::class, 'requestEmailChange']);
        Route::post('/profile/email-change/verify', [AdminProfileController::class, 'verifyEmailChange']);
        Route::post('/products/{id}/restore', [ProductController::class, 'restore'])->middleware('admin.role:owner');
        Route::delete('/products/{id}/permanent', [ProductController::class, 'forceDestroy'])->middleware('admin.role:break_glass');
    });

    Route::get('/products/recycle-bin', [ProductController::class, 'recycleBin'])->middleware('admin.role:owner,break_glass');
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('admin.role:owner');

    Route::get('/orders', [OrderController::class, 'index']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});
