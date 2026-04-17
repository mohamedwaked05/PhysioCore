<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RehabPlanProgress extends Model
{
    protected $fillable = [
        'rehab_plan_id',
        'client_profile_id',
        'day_of_week',
        'completed',
        'completed_at',
    ];

    protected $casts = [
        'completed'    => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(RehabPlan::class, 'rehab_plan_id');
    }
}
