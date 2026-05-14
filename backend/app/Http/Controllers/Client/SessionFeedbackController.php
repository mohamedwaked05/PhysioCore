<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreSessionFeedbackRequest;
use App\Jobs\AnalyzeProgressJob;
use App\Jobs\AnalyzeSessionJob;
use App\Models\ExerciseLog;
use App\Models\PainEffortLog;
use App\Models\RehabPlan;
use App\Models\SessionFeedback;
use Carbon\Carbon;

class SessionFeedbackController extends Controller
{

    public function store(StoreSessionFeedbackRequest $request)
    {
        $profile  = $request->user()->clientProfile;
        $clinicId = (int) $request->clinic_id;
        $today    = Carbon::now('UTC')->toDateString();

        $approved = $profile->accessRequests()
            ->where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'You are not a patient of this clinic.'], 403);
        }

        // ── Resolve valid exercise IDs ────────────────────────
        // Filter submitted IDs against the current plan so stale IDs (from a
        // plan the clinic just edited) are silently dropped instead of blocking
        // the whole feedback submission.
        $exerciseIds = [];
        if (!empty($request->exercise_ids)) {
            $plan = RehabPlan::where('client_profile_id', $profile->id)
                ->where('clinic_id', $clinicId)
                ->latest()
                ->first();

            if ($plan) {
                $validIds    = $plan->exercises()->pluck('id')->toArray();
                $exerciseIds = array_values(array_intersect(
                    array_map('intval', $request->exercise_ids),
                    $validIds
                ));
            }
        }

        // ── Save session feedback ─────────────────────────────
        $feedback = SessionFeedback::updateOrCreate(
            [
                'client_profile_id' => $profile->id,
                'clinic_id'         => $clinicId,
                'session_date'      => $today,
            ],
            [
                'rating'              => $request->rating,
                'pain_level'          => $request->pain_level,
                'effort_level'        => $request->effort_level,
                'feedback_text'       => $request->feedback_text,
                'exercises_completed' => $request->exercises_completed,
                'exercises_total'     => $request->exercises_total,
            ]
        );

        // ── Save pain/effort log ──────────────────────────────
        if ($request->pain_level || $request->effort_level) {
            PainEffortLog::updateOrCreate(
                [
                    'client_profile_id' => $profile->id,
                    'clinic_id'         => $clinicId,
                    'session_date'      => $today,
                ],
                [
                    'pain_level'   => $request->pain_level ?? 0,
                    'effort_level' => $request->effort_level ?? 0,
                ]
            );
        }

        // ── Save exercise logs ────────────────────────────────
        if (!empty($exerciseIds)) {
            $completedAt = Carbon::now('UTC');
            foreach ($exerciseIds as $exerciseId) {
                ExerciseLog::updateOrCreate(
                    [
                        'rehab_plan_exercise_id' => (int) $exerciseId,
                        'client_profile_id'      => $profile->id,
                        'session_date'           => $today,
                    ],
                    [
                        'completed'    => true,
                        'completed_at' => $completedAt,
                    ]
                );
            }
        }

        // ── AI: session safety analysis (background) ─────────
        // Dispatched to the queue — no longer blocks the HTTP response.
        // Critical real-time alerts (pain ≥ 9) are still handled immediately
        // by the separate POST /client/ai/escalate endpoint, which fires from
        // the frontend before the user ever reaches the submit button.
        if ($request->pain_level) {
            dispatch(new AnalyzeSessionJob(
                clientProfileId:    $profile->id,
                clinicId:           $clinicId,
                painLevel:          (float) $request->pain_level,
                effortLevel:        (float) ($request->effort_level ?? 0),
                exercisesCompleted: (int)   ($request->exercises_completed ?? 0),
                today:              $today,
                feedbackId:         $feedback->id,
            ));
        }

        // ── AI: progress analysis — queued so it survives process restarts ──
        dispatch(new AnalyzeProgressJob($profile->id, $clinicId, $today));

        return response()->json(array_merge(
            $feedback->toArray(),
            ['ai' => null]
        ), 201);
    }

}
