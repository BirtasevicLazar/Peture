<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    protected $fillable = [
        'worker_id',
        'user_id',
        'day_of_week',
        'is_working',
        'start_time',
        'end_time',
        'has_break',
        'break_start',
        'break_end'
    ];

    protected $casts = [
        'is_working' => 'boolean',
        'has_break' => 'boolean',
        'start_time' => 'string',
        'end_time' => 'string',
        'break_start' => 'string',
        'break_end' => 'string'
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}