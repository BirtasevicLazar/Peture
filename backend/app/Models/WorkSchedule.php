<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'worker_id',
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
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'break_start' => 'datetime:H:i',
        'break_end' => 'datetime:H:i'
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }

    public function salon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}