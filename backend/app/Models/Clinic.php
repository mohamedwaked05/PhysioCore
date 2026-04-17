<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    protected $fillable = [
        'user_id',
        'legal_name',
        'commercial_name',
        'clinic_email',
        'clinic_mobile',
        'address',
        'tax_id',
        'description',
        'specialty_text',
        'license_number',
        'license_file_url',
        'cert_file_url',
        'profile_photo_url',
        'certifications',
        'experience',
        'payment_methods',
        'services',
        'working_hours',
        'social_media_link',
        'min_price',
        'max_price',
        'estimated_response_time',
        'verification_status',
        'rejection_reason',
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
