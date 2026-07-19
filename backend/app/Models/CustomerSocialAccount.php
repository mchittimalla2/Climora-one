<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CustomerSocialAccount extends Model {
    protected $fillable = ['customer_id', 'provider', 'provider_user_id', 'provider_email'];
    public function customer() { return $this->belongsTo(Customer::class); }
}
