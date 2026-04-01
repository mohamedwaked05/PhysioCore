<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    protected $fillable = [
        'user_id',
        'date_of_birth',
        'gender',
        'phone',
        'address',
        'medical_history',
        'allergies',
        'current_medications',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
