<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedBigInteger('last_number')->default(0);
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->unique();
            $table->date('invoice_date')->index();
            $table->string('disk', 64);
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type', 100)->default('application/pdf');
            $table->unsignedBigInteger('file_size');
            $table->timestamp('generated_at');
            $table->timestamps();
        });

        Schema::create('invoice_download_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index(['invoice_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_download_tokens');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('invoice_sequences');
    }
};
