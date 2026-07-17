<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminEmailChangeRequest extends Model
{
    protected $fillable = ['user_id','new_email','code_hash','attempts','expires_at','consumed_at','requested_ip','user_agent'];
    protected $casts = ['expires_at' => 'datetime', 'consumed_at' => 'datetime', 'attempts' => 'integer'];

    public function isUsable(): bool
    {
        return !$this->consumed_at && $this->expires_at->isFuture() && $this->attempts < 5;
    }
}
