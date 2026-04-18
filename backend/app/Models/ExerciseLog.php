<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExerciseLog extends Model
{
    protected $fillable = [
        'rehab_plan_exercise_id',
        'client_profile_id',
        'completed',
        'completed_at',
        'session_date',
    ];

    protected $casts = [
        'completed'    => 'boolean',
        'completed_at' => 'datetime',
        'session_date' => 'date',
    ];

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(RehabPlanExercise::class, 'rehab_plan_exercise_id');
    }

    public function clientProfile(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class);
    }
}
