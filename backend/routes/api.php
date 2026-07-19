<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminIdentifierAuthController;
use App\Http\Controllers\Api\AdminProfileController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\CustomerGoogleAuthController;
use App\Http\Controllers\Api\CustomerAccountController;

Route::get('/products', [ProductController::class, 'index']);
Route::post('/payments/create-order', [PaymentController::class, 'createOrder'])->middleware('throttle:checkout');
Route::post('/payments/verify', [PaymentController::class, 'verify'])->middleware('throttle:checkout');
Route::post('/payments/cancel', [PaymentController::class, 'cancel'])->middleware('throttle:checkout');
Route::post('/razorpay/webhook', [PaymentController::class, 'webhook']);
Route::post('/track-order', [OrderController::class, 'track'])->middleware('throttle:order-track');
Route::get('/invoices/download/{token}', [InvoiceController::class, 'download'])->where('token', '[a-f0-9]{64}')
    ->middleware('throttle:order-track')
    ->name('invoices.download');

Route::prefix('customer/auth')->group(function () {
    Route::post('/register', [CustomerAuthController::class, 'register'])->middleware('throttle:customer-register');
    Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:customer-login');
    Route::post('/forgot-password', [CustomerAuthController::class, 'forgot'])->middleware('throttle:customer-sensitive');
    Route::post('/reset-password', [CustomerAuthController::class, 'reset'])->middleware('throttle:customer-sensitive');
    Route::post('/email/verify', [CustomerAuthController::class, 'verify'])->middleware('throttle:customer-sensitive');
    Route::get('/google/redirect', [CustomerGoogleAuthController::class, 'redirect'])->middleware('throttle:customer-sensitive');
    Route::get('/google/callback', [CustomerGoogleAuthController::class, 'callback'])->middleware('throttle:customer-sensitive');
    Route::post('/google/exchange', [CustomerGoogleAuthController::class, 'exchange'])->middleware('throttle:customer-sensitive');
});

Route::post('/customer/email-change/verify', [CustomerAccountController::class, 'verifyEmailChange'])->middleware('throttle:customer-sensitive');

Route::prefix('customer')->middleware(['auth:sanctum', 'customer.active'])->group(function () {
    Route::post('/auth/logout', [CustomerAuthController::class, 'logout']);
    Route::post('/auth/email/resend', [CustomerAuthController::class, 'resend'])->middleware('throttle:customer-sensitive');
    Route::get('/me', [CustomerAccountController::class, 'me']);
    Route::put('/profile', [CustomerAccountController::class, 'profile']);
    Route::put('/password', [CustomerAccountController::class, 'password'])->middleware(['customer.verified', 'throttle:customer-sensitive']);
    Route::middleware('customer.verified')->group(function () {
        Route::get('/orders', [CustomerAccountController::class, 'orders']);
        Route::get('/orders/{order}', [CustomerAccountController::class, 'order']);
        Route::get('/orders/{order}/invoice', [CustomerAccountController::class, 'invoice']);
        Route::get('/recommendations', [CustomerAccountController::class, 'recommendations']);
    });
});

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
    Route::get('/orders/{order}/invoice', [InvoiceController::class, 'adminDownload']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});
