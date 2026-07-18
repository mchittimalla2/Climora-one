<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('razorpay');
            $table->string('provider_order_id')->unique();
            $table->string('provider_payment_id')->nullable()->unique();
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('INR');
            $table->string('status')->default('created')->index();
            $table->string('method')->nullable();
            $table->boolean('signature_verified')->default(false);
            $table->boolean('inventory_processed')->default(false);
            $table->string('failure_code')->nullable();
            $table->text('failure_description')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_webhook_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_event_id')->unique();
            $table->string('event_type')->index();
            $table->string('processing_status')->default('received');
            $table->text('processing_error')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('email_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type')->index();
            $table->string('recipient_email');
            $table->string('recipient_type')->default('customer');
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('attempts')->default(0);
            $table->string('provider_message_id')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['order_id', 'event_type', 'recipient_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_notifications');
        Schema::dropIfExists('payment_events');
        Schema::dropIfExists('payments');
    }
};
