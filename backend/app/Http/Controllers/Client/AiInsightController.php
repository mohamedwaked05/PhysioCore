<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Models\Clinic;
use App\Models\Message;
use App\Models\PainEffortLog;
use App\Models\RehabPlan;
use App\Models\SessionFeedback;
use App\Services\AiService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    public function __construct(
        private AiService $ai,
        private NotificationService $notifications,
    ) {}

    /**
     * POST /client/ai/escalate
     * Called by frontend when pain_level crosses ≥9 in real-time.
     * Triggers immediate AI check + notifies clinic with CRITICAL message.
     */
    public function escalate(Request $request)
    {
        $request->validate([
            'clinic_id'   => ['required', 'integer', 'exists:clinics,id'],
            'pain_level'  => ['required', 'integer', 'min:1', 'max:10'],
            'effort_level'=> ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $profile  = $request->user()->clientProfile;
        $clinicId = (int) $request->clinic_id;

        $approved = $profile->accessRequests()
            ->where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'Not a patient of this clinic.'], 403);
        }

        // Fetch recent pain history from pain_effort_logs (primary source)
        $recentPain = PainEffortLog::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->where('session_date', '>=', Carbon::now('UTC')->subDays(14)->toDateString())
            ->orderBy('session_date')
            ->pluck('pain_level')
            ->map(fn($v) => (float) $v)
            ->all();

        $aiResult = $this->ai->analyzeSession([
            'client_id'              => $profile->id,
            'clinic_id'              => $clinicId,
            'pain_level'             => $request->pain_level,
            'effort_level'           => $request->effort_level ?? 0,
            'completed_exercises'    => 0,
            'previous_pain_levels'   => $recentPain,
        ]);

        if (!$aiResult || !$aiResult['safety_flag']) {
            return response()->json([
                'safety_flag' => false,
                'flag_reason' => null,
                'severity'    => null,
            ]);
        }

        // Resolve session_feedback_id for today — creates a stub if none exists yet.
        // The actual session data is filled in (or updated) on session submit.
        $today           = Carbon::now('UTC')->toDateString();
        $sessionFeedback = SessionFeedback::firstOrCreate([
            'client_profile_id' => $profile->id,
            'clinic_id'         => $clinicId,
            'session_date'      => $today,
        ]);

        // Idempotent insert: DB unique constraint on (session_feedback_id, insight_type)
        // is the hard guard; wasRecentlyCreated controls the notification gate.
        $insight = AiInsight::firstOrCreate(
            [
                'session_feedback_id' => $sessionFeedback->id,
                'insight_type'        => 'session',
            ],
            [
                'client_profile_id' => $profile->id,
                'clinic_id'         => $clinicId,
                'safety_flag'       => true,
                'flag_reason'       => $aiResult['flag_reason'],
                'severity'          => $aiResult['severity'],
            ]
        );

        if ($insight->wasRecentlyCreated) {
            $this->notifications->notifyClinic($profile, $clinicId, $aiResult, isCritical: true);
        }

        return response()->json([
            'safety_flag' => true,
            'flag_reason' => $aiResult['flag_reason'],
            'severity'    => $aiResult['severity'],
        ]);
    }

    /**
     * GET /client/ai/latest?clinic_id=X
     * Returns (or generates) the most recent progress insight for the client.
     * Regenerates if no insight exists or the last one is older than 24 hours.
     */
    public function latest(Request $request)
    {
        $request->validate([
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
        ]);

        $profile  = $request->user()->clientProfile;
        $clinicId = (int) $request->clinic_id;

        $approved = $profile->accessRequests()
            ->where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(null);
        }

        // Return cached progress insight if generated within last 24 hours
        $cached = AiInsight::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->where('insight_type', 'progress')
            ->where('created_at', '>=', Carbon::now('UTC')->subHours(24))
            ->latest()
            ->first();

        if ($cached) {
            return response()->json($cached);
        }

        // Build pain_logs from session feedback
        $feedbacks = SessionFeedback::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->orderBy('session_date')
            ->get(['pain_level', 'session_date']);

        $painLogs = $feedbacks
            ->whereNotNull('pain_level')
            ->map(fn($f) => ['pain_level' => (float) $f->pain_level])
            ->values()
            ->all();

        // Build exercise_logs from the latest rehab plan
        $plan = RehabPlan::with(['exercises', 'progress'])
            ->where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->latest()
            ->first();

        $exerciseLogs = [];
        if ($plan) {
            $exercisesByDay = $plan->exercisesByDay();
            $progressByDay  = $plan->progressByDay();
            foreach (RehabPlan::DAYS as $day) {
                $assigned = count($exercisesByDay[$day]);
                if ($assigned > 0) {
                    $exerciseLogs[] = [
                        'assigned_count'  => $assigned,
                        'completed_count' => $progressByDay[$day]['completed'] ? $assigned : 0,
                    ];
                }
            }
        }

        // Need at least some data to produce a meaningful insight
        if (empty($painLogs) && empty($exerciseLogs)) {
            return response()->json(null);
        }

        $aiResult = $this->ai->analyzeProgress([
            'client_id'     => $profile->id,
            'clinic_id'     => $clinicId,
            'pain_logs'     => $painLogs,
            'exercise_logs' => $exerciseLogs,
        ]);

        if (!$aiResult) {
            return response()->json(null);
        }

        $insight = AiInsight::create([
            'client_profile_id' => $profile->id,
            'clinic_id'         => $clinicId,
            'insight_type'      => 'progress',
            'adherence_score'   => $aiResult['adherence_score'] ?? null,
            'pain_trend'        => $aiResult['pain_trend'] ?? null,
            'recovery_status'   => $aiResult['recovery_status'] ?? null,
            'safety_flag'       => false,
        ]);

        return response()->json($insight);
    }

}
