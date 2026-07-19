<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'order_id',
        'invoice_number',
        'invoice_date',
        'disk',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'generated_at',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'file_size' => 'integer',
        'generated_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
