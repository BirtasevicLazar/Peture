<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ime',
        'prezime',
        'email',
        'telefon'
    ];

    public function salon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}