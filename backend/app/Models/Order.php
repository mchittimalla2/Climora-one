<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'pincode',
        'total',
        'status',
        'payment_status'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}