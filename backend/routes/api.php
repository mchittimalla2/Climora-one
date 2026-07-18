<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminIdentifierAuthController;
use App\Http\Controllers\Api\AdminProfileController;

Route::options('/{any}', function () {
    return response('', 204)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
})->where('any', '.*');

Route::get('/products', [ProductController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/track-order', [OrderController::class, 'track']);

Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [AdminIdentifierAuthController::class, 'login']);
    Route::post('/verify-otp', [AdminIdentifierAuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AdminIdentifierAuthController::class, 'resendOtp']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
    });
});

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::put('/profile', [AdminProfileController::class, 'updateProfile']);
    Route::put('/profile/password', [AdminProfileController::class, 'changePassword']);
    Route::post('/profile/email-change', [AdminProfileController::class, 'requestEmailChange']);
    Route::post('/profile/email-change/verify', [AdminProfileController::class, 'verifyEmailChange']);

    Route::get('/products/recycle-bin', [ProductController::class, 'recycleBin']);
    Route::post('/products/{id}/restore', [ProductController::class, 'restore']);
    Route::delete('/products/{id}/permanent', [ProductController::class, 'forceDestroy']);
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
