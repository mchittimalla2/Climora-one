<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CustomerOauthState extends Model {
    protected $fillable = ['customer_id', 'state_hash', 'flow', 'expires_at'];
    protected $casts = ['expires_at' => 'datetime'];
}
