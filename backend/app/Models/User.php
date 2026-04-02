<?php

namespace App\Models;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password_hash',
        'role',
        'status',
        'google_id',
        'provider',
        'email_verified_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_hash'     => 'hashed',
        ];
    }

    /**
     * Override getAuthPassword() so Sanctum/Auth use password_hash column.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Override reset URL to point to the React frontend instead of a Laravel web route.
     */
    public function sendPasswordResetNotification($token): void
    {
        ResetPassword::createUrlUsing(function ($notifiable, $token) {
            return config('app.frontend_url')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($notifiable->email);
        });

        $this->notify(new ResetPassword($token));
    }

    public function clientProfile()
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function clinic()
    {
        return $this->hasOne(Clinic::class);
    }
}
