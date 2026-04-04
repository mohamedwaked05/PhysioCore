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
        'verification_status',
        'rejection_reason',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
