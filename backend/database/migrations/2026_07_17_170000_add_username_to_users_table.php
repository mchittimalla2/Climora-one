<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The previous attempt may already have created this column before
        // failing while generating usernames. This check makes reruns safe.
        if (!Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 50)->nullable()->unique()->after('name');
            });
        }

        DB::table('users')
            ->whereNull('username')
            ->orWhere('username', '')
            ->orderBy('id')
            ->get(['id', 'email'])
            ->each(function ($user) {
                $emailPrefix = strtolower((string) strstr($user->email, '@', true));
                $base = preg_replace('/[^a-z0-9._-]/', '', $emailPrefix) ?: 'admin';
                $base = substr($base, 0, 40);

                $candidate = $base;
                $suffix = 1;

                while (DB::table('users')
                    ->where('username', $candidate)
                    ->where('id', '!=', $user->id)
                    ->exists()) {
                    $candidate = substr($base, 0, 42) . '-' . $suffix++;
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => $candidate]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            });
        }
    }
};
