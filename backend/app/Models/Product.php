<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'category',
        'price',
        'stock',
        'description',
        'main_image',
        'images',
        'deleted_by',
        'purge_eligible_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
        'images' => 'array',
        'deleted_at' => 'datetime',
        'purge_eligible_at' => 'datetime',
    ];

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
