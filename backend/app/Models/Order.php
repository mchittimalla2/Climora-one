<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
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
        'status_history',
        'payment_status',
    ];

    public function customer() { return $this->belongsTo(Customer::class); }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function emailNotifications()
    {
        return $this->hasMany(EmailNotification::class);
    }
}
