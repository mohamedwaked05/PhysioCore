<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RehabPlanExercise extends Model
{
    protected $fillable = [
        'rehab_plan_id',
        'day_of_week',
        'name',
        'sets',
        'reps',
        'notes',
        'alternative_exercise',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(RehabPlan::class, 'rehab_plan_id');
    }
}
