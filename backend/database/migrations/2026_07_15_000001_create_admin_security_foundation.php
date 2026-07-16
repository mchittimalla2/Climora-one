<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdminSecurityFoundation extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->default('admin_editor')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->boolean('is_break_glass')->default(false)->after('is_active');
            $table->boolean('mfa_enabled')->default(true)->after('is_break_glass');
            $table->timestamp('last_login_at')->nullable()->after('mfa_enabled');
            $table->timestamp('locked_until')->nullable()->after('last_login_at');
            $table->unsignedSmallInteger('failed_login_attempts')->default(0)->after('locked_until');
            $table->timestamp('password_changed_at')->nullable()->after('failed_login_attempts');
            $table->index(['role', 'is_active']);
        });

        Schema::create('admin_otp_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('purpose', 40)->default('login');
            $table->string('code_hash', 255);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->string('requested_ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'purpose', 'expires_at']);
        });

        Schema::create('admin_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token_hash', 255)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('mfa_verified_at')->nullable();
            $table->timestamp('last_activity_at');
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at', 'revoked_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('session_id')->nullable();
            $table->string('event', 100);
            $table->string('resource_type', 100)->nullable();
            $table->string('resource_id', 100)->nullable();
            $table->string('result', 20)->default('success');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['event', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('admin_sessions');
        Schema::dropIfExists('admin_otp_codes');

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'is_active']);
            $table->dropColumn([
                'role',
                'is_active',
                'is_break_glass',
                'mfa_enabled',
                'last_login_at',
                'locked_until',
                'failed_login_attempts',
                'password_changed_at',
            ]);
        });
    }
}
