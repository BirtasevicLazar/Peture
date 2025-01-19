<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'worker_id',
        'service_id',
        'start_time',
        'end_time',
        'customer_name',
        'customer_email',
        'customer_phone',
        'status' // available, booked, completed, cancelled
    ];

    protected $casts = [
        'start_time' => 'datetime:Y-m-d H:i:s',
        'end_time' => 'datetime:Y-m-d H:i:s'
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function salon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
} 