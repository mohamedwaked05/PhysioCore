<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
    protected $table = 'ai_insights';

    protected $fillable = [
        'client_profile_id',
        'clinic_id',
        'session_feedback_id',
        'insight_type',
        'adherence_score',
        'pain_trend',
        'recovery_status',
        'safety_flag',
        'flag_reason',
        'severity',
    ];

    protected $casts = [
        'safety_flag'     => 'boolean',
        'adherence_score' => 'integer',
        'resolved_at'     => 'datetime',
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
