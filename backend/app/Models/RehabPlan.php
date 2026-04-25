<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RehabPlan extends Model
{
    use SoftDeletes;
    const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

    protected $fillable = [
        'clinic_id',
        'client_profile_id',
        'injury_type',
        'week_number',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
    ];

    public function exercises(): HasMany
    {
        return $this->hasMany(RehabPlanExercise::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(RehabPlanProgress::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function clientProfile(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class);
    }

    public function exercisesByDay(): array
    {
        $grouped = array_fill_keys(self::DAYS, []);
        foreach ($this->exercises as $ex) {
            $grouped[$ex->day_of_week][] = $ex;
        }
        return $grouped;
    }

    public function progressByDay(): array
    {
        $result = array_fill_keys(self::DAYS, ['completed' => false, 'completed_at' => null]);
        foreach ($this->progress as $p) {
            $result[$p->day_of_week] = [
                'completed'    => $p->completed,
                'completed_at' => $p->completed_at?->toISOString(),
            ];
        }
        return $result;
    }
}
