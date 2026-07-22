<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $fillable = ['name', 'username', 'email', 'email_verified_at', 'phone', 'phone_verified_at', 'password', 'avatar_url', 'status', 'last_login_at'];
    protected $hidden = ['password', 'remember_token'];
    protected $appends = ['has_password'];
    protected $casts = ['email_verified_at' => 'datetime', 'phone_verified_at' => 'datetime', 'last_login_at' => 'datetime'];

    public function orders() { return $this->hasMany(Order::class); }
    public function socialAccounts() { return $this->hasMany(CustomerSocialAccount::class); }
    public function isActive(): bool { return $this->status === 'active' && !$this->trashed(); }
    public function getHasPasswordAttribute(): bool { return $this->password !== null; }
}
