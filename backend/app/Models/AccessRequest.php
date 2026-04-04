<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessRequest extends Model
{
    protected $fillable = [
        'client_profile_id',
        'clinic_id',
        'status',
        'notes',
        'payment_preference',
    ];

    public function clientProfile()
    {
        return $this->belongsTo(ClientProfile::class);
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
