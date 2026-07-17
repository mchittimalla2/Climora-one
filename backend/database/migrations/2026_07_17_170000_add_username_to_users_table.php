<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->unique()->after('name');
        });

        DB::table('users')->orderBy('id')->get(['id', 'email'])->each(function ($user) {
            $base = Str::of(Str::before($user->email, '@'))->lower()->replaceMatches('/[^a-z0-9._-]/', '')->substr(0, 40)->value() ?: 'admin';
            $candidate = $base;
            $suffix = 1;

            while (DB::table('users')->where('username', $candidate)->exists()) {
                $candidate = Str::limit($base, 42, '') . '-' . $suffix++;
            }

            DB::table('users')->where('id', $user->id)->update(['username' => $candidate]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
