<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        $accounts = [
            [
                'name' => env('ADMIN_OWNER_NAME'),
                'email' => env('ADMIN_OWNER_EMAIL'),
                'password' => env('ADMIN_OWNER_PASSWORD'),
                'role' => User::ROLE_OWNER,
                'is_break_glass' => false,
            ],
            [
                'name' => env('ADMIN_EDITOR_NAME'),
                'email' => env('ADMIN_EDITOR_EMAIL'),
                'password' => env('ADMIN_EDITOR_PASSWORD'),
                'role' => User::ROLE_EDITOR,
                'is_break_glass' => false,
            ],
            [
                'name' => env('ADMIN_BREAK_GLASS_NAME'),
                'email' => env('ADMIN_BREAK_GLASS_EMAIL'),
                'password' => env('ADMIN_BREAK_GLASS_PASSWORD'),
                'role' => User::ROLE_BREAK_GLASS,
                'is_break_glass' => true,
            ],
        ];

        foreach ($accounts as $account) {
            if (!$account['email'] || !$account['password']) {
                continue;
            }

            User::updateOrCreate(
                ['email' => Str::lower(trim($account['email']))],
                [
                    'name' => $account['name'] ?: ucfirst(str_replace('_', ' ', $account['role'])),
                    'password' => Hash::make($account['password']),
                    'role' => $account['role'],
                    'is_active' => true,
                    'is_break_glass' => $account['is_break_glass'],
                    'mfa_enabled' => true,
                    'email_verified_at' => now(),
                    'password_changed_at' => now(),
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ]
            );
        }
    }
}
