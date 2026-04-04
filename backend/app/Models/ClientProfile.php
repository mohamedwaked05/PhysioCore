<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    protected $fillable = [
        'user_id',
        'nickname',
        'date_of_birth',
        'gender',
        'language',
        'country',
        'timezone',
        'phone',
        'address',
        'profile_photo_url',
        'condition_summary',
        'injury_details',
        'medical_history',
        'allergies',
        'current_medications',
        'emergency_contact',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function accessRequests()
    {
        return $this->hasMany(AccessRequest::class);
    }
}
