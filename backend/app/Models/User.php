<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'salon_name',
        'slug',
        'address',
        'city',
        'phone',
        'is_active',
        'remember_token',
        'salon_image',
        'description'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($user) {
            if ($user->salon_name) {
                $slug = Str::slug($user->salon_name);
                $count = static::whereRaw("slug RLIKE '^{$slug}(-[0-9]+)?$'")->count();
                $user->slug = $count ? "{$slug}-{$count}" : $slug;
            }
        });

        static::updating(function ($user) {
            if ($user->isDirty('salon_name')) {
                $slug = Str::slug($user->salon_name);
                $count = static::whereRaw("slug RLIKE '^{$slug}(-[0-9]+)?$'")->count();
                $user->slug = $count ? "{$slug}-{$count}" : $slug;
            }
        });
    }

    /**
     * Get the workers for the salon.
     */
    public function workers()
    {
        return $this->hasMany(Worker::class);
    }

    /**
     * Get the services for the salon.
     */
    public function services()
    {
        return $this->hasMany(Service::class);
    }
}
