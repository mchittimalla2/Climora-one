<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_EDITOR = 'admin_editor';
    public const ROLE_OWNER = 'owner';
    public const ROLE_BREAK_GLASS = 'break_glass';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'is_break_glass',
        'mfa_enabled',
        'last_login_at',
        'locked_until',
        'failed_login_attempts',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'is_break_glass' => 'boolean',
        'mfa_enabled' => 'boolean',
        'last_login_at' => 'datetime',
        'locked_until' => 'datetime',
        'failed_login_attempts' => 'integer',
        'password_changed_at' => 'datetime',
    ];

    public function otpCodes()
    {
        return $this->hasMany(AdminOtpCode::class);
    }

    public function adminSessions()
    {
        return $this->hasMany(AdminSession::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function isEditor(): bool
    {
        return $this->role === self::ROLE_EDITOR;
    }

    public function isBreakGlass(): bool
    {
        return $this->is_break_glass || $this->role === self::ROLE_BREAK_GLASS;
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function canManageAdmins(): bool
    {
        return $this->isOwner() || $this->isBreakGlass();
    }

    public function canPermanentlyDelete(): bool
    {
        return $this->isOwner() || $this->isBreakGlass();
    }
}
