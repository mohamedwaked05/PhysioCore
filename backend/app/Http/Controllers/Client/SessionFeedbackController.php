<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreSessionFeedbackRequest;
use App\Jobs\AnalyzeSessionJob;
use App\Models\AiInsight;
use App\Models\ExerciseLog;
use App\Models\PainEffortLog;
use App\Models\RehabPlan;
use App\Models\SessionFeedback;
use App\Services\AiService;
use Carbon\Carbon;

class SessionFeedbackController extends Controller
{
    public function __construct(private AiService $ai) {}

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

        // ── Exercise ownership validation ─────────────────────
        if (!empty($request->exercise_ids)) {
            $plan = RehabPlan::where('client_profile_id', $profile->id)
                ->where('clinic_id', $clinicId)
                ->latest()
                ->first();

            if (!$plan) {
                return response()->json(['message' => 'No rehab plan found for this clinic.'], 422);
            }

            $validIds     = $plan->exercises()->pluck('id')->all();
            $submittedIds = array_map('intval', $request->exercise_ids);
            $invalidIds   = array_diff($submittedIds, $validIds);

            if (!empty($invalidIds)) {
                return response()->json(['message' => 'One or more exercise IDs do not belong to your plan.'], 403);
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
        if (!empty($request->exercise_ids)) {
            $completedAt = Carbon::now('UTC');
            foreach ($request->exercise_ids as $exerciseId) {
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

        // ── AI: progress analysis — deferred after response ──
        app()->terminating(function () use ($profile, $clinicId, $today) {
            $this->runProgressAnalysis($profile, $clinicId, $today);
        });

        return response()->json(array_merge(
            $feedback->toArray(),
            ['ai' => null]
        ), 201);
    }

    private function runProgressAnalysis($profile, int $clinicId, string $today): void
    {
        try {
            $twoWeeksAgo = Carbon::now('UTC')->subDays(14)->toDateString();

            // Fetch pain logs (primary: pain_effort_logs)
            $painLogs = PainEffortLog::where('client_profile_id', $profile->id)
                ->where('clinic_id', $clinicId)
                ->where('session_date', '>=', $twoWeeksAgo)
                ->orderBy('session_date')
                ->select(['session_date', 'pain_level'])
                ->get()
                ->map(fn($r) => [
                    'date'        => $r->session_date instanceof Carbon
                        ? $r->session_date->toDateString()
                        : substr((string) $r->session_date, 0, 10),
                    'pain_level'  => (float) $r->pain_level,
                ])
                ->all();

            // Build exercise logs: per session_date — completed vs total
            $exerciseLogs = ExerciseLog::where('client_profile_id', $profile->id)
                ->where('session_date', '>=', $twoWeeksAgo)
                ->selectRaw('session_date, COUNT(*) as completed_count')
                ->groupBy('session_date')
                ->orderBy('session_date')
                ->get()
                ->map(function ($r) use ($clinicId) {
                    // Assigned count = total exercises in the plan (approximated by day)
                    // Use completed_count as a proxy if we don't have assigned
                    return [
                        'date'            => $r->session_date instanceof Carbon
                            ? $r->session_date->toDateString()
                            : substr((string) $r->session_date, 0, 10),
                        'completed_count' => (int) $r->completed_count,
                        'assigned_count'  => (int) $r->completed_count, // fallback
                    ];
                })
                ->all();

            // Use session_feedbacks for completed/total if available
            $sessionFeedbacks = SessionFeedback::where('client_profile_id', $profile->id)
                ->where('clinic_id', $clinicId)
                ->where('session_date', '>=', $twoWeeksAgo)
                ->select(['session_date', 'exercises_completed', 'exercises_total'])
                ->orderBy('session_date')
                ->get();

            if ($sessionFeedbacks->isNotEmpty()) {
                $exerciseLogs = $sessionFeedbacks->map(fn($r) => [
                    'date'            => $r->session_date instanceof Carbon
                        ? $r->session_date->toDateString()
                        : substr((string) $r->session_date, 0, 10),
                    'completed_count' => (int) $r->exercises_completed,
                    'assigned_count'  => max(1, (int) $r->exercises_total),
                ])->all();
            }

            $result = $this->ai->analyzeProgress([
                'client_id'     => $profile->id,
                'clinic_id'     => $clinicId,
                'pain_logs'     => $painLogs,
                'exercise_logs' => $exerciseLogs,
            ]);

            if ($result) {
                AiInsight::create([
                    'client_profile_id' => $profile->id,
                    'clinic_id'         => $clinicId,
                    'insight_type'      => 'progress',
                    'adherence_score'   => $result['adherence_score'],
                    'pain_trend'        => $result['pain_trend'],
                    'recovery_status'   => $result['recovery_status'],
                    'safety_flag'       => false,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AI progress analysis failed: ' . $e->getMessage());
        }
    }
}
