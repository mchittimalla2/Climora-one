<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceDownloadToken extends Model
{
    protected $fillable = [
        'invoice_id',
        'token_hash',
        'expires_at',
        'last_used_at',
    ];

    protected $hidden = ['token_hash'];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
