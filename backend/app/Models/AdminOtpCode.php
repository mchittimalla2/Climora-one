<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminOtpCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'purpose',
        'code_hash',
        'expires_at',
        'consumed_at',
        'attempts',
        'requested_ip',
        'user_agent',
    ];

    protected $hidden = [
        'code_hash',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isUsable(): bool
    {
        return $this->consumed_at === null
            && $this->expires_at->isFuture()
            && $this->attempts < 5;
    }
}
