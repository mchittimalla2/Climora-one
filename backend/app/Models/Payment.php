<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'provider',
        'provider_order_id',
        'provider_payment_id',
        'amount',
        'currency',
        'status',
        'method',
        'signature_verified',
        'inventory_processed',
        'failure_code',
        'failure_description',
        'gateway_response',
        'captured_at',
        'verified_at',
        'last_webhook_at',
    ];

    protected $casts = [
        'signature_verified' => 'boolean',
        'inventory_processed' => 'boolean',
        'gateway_response' => 'array',
        'captured_at' => 'datetime',
        'verified_at' => 'datetime',
        'last_webhook_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function events()
    {
        return $this->hasMany(PaymentEvent::class);
    }
}
