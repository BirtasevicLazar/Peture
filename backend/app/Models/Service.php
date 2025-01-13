<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'user_id',
        'worker_id',
        'naziv',
        'opis',
        'cena',
        'trajanje'
    ];

    protected static function boot()
    {
        parent::boot();
        
        // Automatically set user_id when creating a new service
        static::creating(function ($service) {
            if (!$service->user_id) {
                $service->user_id = auth()->id();
            }
        });
    }

    public function worker()
    {
        return $this->belongsTo(Worker::class)->withDefault();
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withDefault();
    }
}
