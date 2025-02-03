<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkerOffDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'worker_id',
        'start_date',
        'end_date',
        'reason'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date'
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }
}
