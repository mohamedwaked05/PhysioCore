<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionFeedback extends Model
{
    protected $table = 'session_feedbacks';

    protected $fillable = [
        'client_profile_id',
        'clinic_id',
        'rating',
        'pain_level',
        'feedback_text',
        'exercises_completed',
        'exercises_total',
        'session_date',
    ];

    protected $casts = [
        'session_date' => 'date',
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
