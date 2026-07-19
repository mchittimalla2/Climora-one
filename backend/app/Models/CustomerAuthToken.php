<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CustomerAuthToken extends Model {
    protected $fillable = ['customer_id', 'purpose', 'token_hash', 'pending_email', 'expires_at', 'used_at'];
    protected $casts = ['expires_at' => 'datetime', 'used_at' => 'datetime'];
    public function customer() { return $this->belongsTo(Customer::class); }
}
