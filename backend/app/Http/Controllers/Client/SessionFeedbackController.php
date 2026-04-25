<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreSessionFeedbackRequest;
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

        // ── AI: session safety analysis ───────────────────────
        $safetyResult = null;
        if ($request->pain_level) {
            $safetyResult = $this->runSessionAnalysis($profile, $clinicId, $request, $today, $feedback->id);
        }

        // ── AI: progress analysis — deferred after response ──
        // runProgressAnalysis makes a blocking AI API call whose result is not
        // returned to the client. Defer it to the request's terminating phase so
        // the HTTP response is sent immediately.
        app()->terminating(function () use ($profile, $clinicId, $today) {
            $this->runProgressAnalysis($profile, $clinicId, $today);
        });

        return response()->json(array_merge(
            $feedback->toArray(),
            ['ai' => $safetyResult ? ['safety_flag' => $safetyResult['safety_flag'], 'flag_reason' => $safetyResult['flag_reason'], 'severity' => $safetyResult['severity'] ?? null] : null]
        ), 201);
    }

    // ── Private helpers ────────────────────────────────────────

    private function runSessionAnalysis($profile, int $clinicId, $request, string $today, int $feedbackId): ?array
    {
        $recentPain = PainEffortLog::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->where('session_date', '<', $today)
            ->where('session_date', '>=', Carbon::now('UTC')->subDays(14)->toDateString())
            ->orderBy('session_date')
            ->pluck('pain_level')
            ->map(fn($v) => (float) $v)
            ->all();

        $result = $this->ai->analyzeSession([
            'client_id'            => $profile->id,
            'clinic_id'            => $clinicId,
            'pain_level'           => $request->pain_level,
            'effort_level'         => $request->effort_level ?? 0,
            'completed_exercises'  => $request->exercises_completed,
            'previous_pain_levels' => $recentPain,
        ]);

        if (!$result) return null;

        if ($result['safety_flag']) {
            // Idempotent: unique DB constraint on (session_feedback_id, insight_type)
            // is the hard guard; wasRecentlyCreated gates the notification.
            $insight = AiInsight::firstOrCreate(
                [
                    'session_feedback_id' => $feedbackId,
                    'insight_type'        => 'session',
                ],
                [
                    'client_profile_id' => $profile->id,
                    'clinic_id'         => $clinicId,
                    'safety_flag'       => true,
                    'flag_reason'       => $result['flag_reason'],
                    'severity'          => $result['severity'] ?? null,
                ]
            );

            if ($insight->wasRecentlyCreated) {
                $aiController = app(AiInsightController::class);
                $aiController->notifyClinic(
                    $profile,
                    $clinicId,
                    $result,
                    isCritical: ($result['severity'] ?? '') === 'critical'
                );
            }
        }

        return $result;
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
