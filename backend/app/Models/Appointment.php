<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'worker_id',
        'service_id',
        'custom_service_name',
        'custom_service_duration',
        'custom_service_price',
        'start_time',
        'end_time',
        'customer_name',
        'customer_phone',
        'customer_email',
        'status' // available, booked, completed, cancelled
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'custom_service_price' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function salon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
} 