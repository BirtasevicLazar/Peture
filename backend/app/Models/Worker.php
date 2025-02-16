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
        'telefon',
        'time_slot',
        'booking_window',
        'profile_image'
    ];

    public function salon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedules()
    {
        return $this->hasMany(WorkSchedule::class);
    }

    public function offDays()
    {
        return $this->hasMany(WorkerOffDay::class);
    }
}