<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Models\Message;
use App\Models\PainEffortLog;
use App\Models\SessionFeedback;
use App\Services\AiService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    public function __construct(private AiService $ai) {}

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
            $this->notifyClinic($profile, $clinicId, $aiResult, isCritical: true);
        }

        return response()->json([
            'safety_flag' => true,
            'flag_reason' => $aiResult['flag_reason'],
            'severity'    => $aiResult['severity'],
        ]);
    }

    /**
     * GET /client/ai/latest?clinic_id=X
     * Returns the most recent progress insight for the client.
     */
    public function latest(Request $request)
    {
        $request->validate([
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
        ]);

        $profile  = $request->user()->clientProfile;
        $clinicId = (int) $request->clinic_id;

        $insight = AiInsight::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->where('insight_type', 'progress')
            ->latest()
            ->first();

        return response()->json($insight);
    }

    // ── Internal helper ────────────────────────────────────────

    public function notifyClinic(
        $profile,
        int $clinicId,
        array $aiResult,
        bool $isCritical = false
    ): void {
        try {
            $clinic = \App\Models\Clinic::find($clinicId);
            if (!$clinic) return;

            $user      = $profile->user;
            $firstName = $user?->first_name ?? 'A patient';
            $lastName  = $user?->last_name  ?? '';
            $painLevel = $aiResult['flag_reason'] ?? 'high pain';

            $body = $isCritical
                ? "🚨 CRITICAL: {$firstName} {$lastName} reported very high pain during their session. Immediate attention may be required."
                : "⚠️ Safety Alert: {$firstName} {$lastName} reported {$painLevel} during their session.";

            Message::create([
                'sender_id'   => $user->id,
                'receiver_id' => $clinic->user_id,
                'context'     => 'safety_alert',
                'reference_id'=> $clinicId,
                'content'     => $body,
                'is_read'     => false,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send safety alert message: ' . $e->getMessage());
        }
    }
}
