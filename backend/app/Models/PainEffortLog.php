<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PainEffortLog extends Model
{
    protected $fillable = [
        'client_profile_id',
        'clinic_id',
        'pain_level',
        'effort_level',
        'session_date',
    ];

    protected $casts = [
        'session_date' => 'date',
    ];

    public function clientProfile(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}
