<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    /**
     * GET /clinic/patients/{clientProfileId}/ai-insights
     * Latest progress insight + recent unresolved safety flags for a patient.
     */
    public function show(Request $request, int $clientProfileId)
    {
        $clinicId = $request->user()->clinic->id;

        $latest = AiInsight::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinicId)
            ->where('insight_type', 'progress')
            ->latest()
            ->first();

        $safetyHistory = AiInsight::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->whereNull('resolved_at')
            ->select(['id', 'flag_reason', 'severity', 'created_at'])
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'latest'         => $latest,
            'safety_history' => $safetyHistory,
        ]);
    }

    /**
     * GET /clinic/dashboard/ai-summary
     * Aggregate AI metrics for the overview page (unresolved flags only).
     */
    public function summary(Request $request)
    {
        $clinicId = $request->user()->clinic->id;

        $activeFlags = AiInsight::where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->whereNull('resolved_at')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $criticalFlags = AiInsight::where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->whereNull('resolved_at')
            ->where('severity', 'critical')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $insights = AiInsight::where('clinic_id', $clinicId)
            ->where('insight_type', 'progress')
            ->select(['client_profile_id', 'adherence_score', 'pain_trend', 'recovery_status', 'created_at'])
            ->latest()
            ->get()
            ->unique('client_profile_id');

        $avgAdherence = $insights->whereNotNull('adherence_score')->avg('adherence_score');

        $trendCounts = $insights->whereNotNull('pain_trend')
            ->groupBy('pain_trend')
            ->map->count();

        return response()->json([
            'active_flags'   => $activeFlags,
            'critical_flags' => $criticalFlags,
            'avg_adherence'  => $avgAdherence ? round((float) $avgAdherence) : null,
            'trend_counts'   => $trendCounts,
        ]);
    }

    /**
     * GET /clinic/dashboard/safety-flags
     * All unresolved safety insights for this clinic with patient info.
     */
    public function flags(Request $request)
    {
        $clinicId = $request->user()->clinic->id;

        $flags = AiInsight::where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->whereNull('resolved_at')
            ->with([
                'clientProfile' => fn($q) => $q->select(['id', 'user_id', 'condition_summary'])
                    ->with(['user' => fn($q) => $q->select(['id', 'first_name', 'last_name'])]),
            ])
            ->select(['id', 'client_profile_id', 'flag_reason', 'severity', 'created_at'])
            ->latest()
            ->get()
            ->map(function ($insight) {
                $u         = $insight->clientProfile?->user;
                $firstName = $u?->first_name ?? '';
                $lastName  = $u?->last_name  ?? '';
                $fullName  = trim("{$firstName} {$lastName}") ?: 'Unknown Patient';
                $initials  = strtoupper(($firstName[0] ?? '') . ($lastName[0] ?? '')) ?: '?';

                return [
                    'id'                => $insight->id,
                    'client_profile_id' => $insight->client_profile_id,
                    'patient_name'      => $fullName,
                    'initials'          => $initials,
                    'condition'         => $insight->clientProfile?->condition_summary ?? '—',
                    'flag_reason'       => $insight->flag_reason,
                    'severity'          => $insight->severity,
                    'created_at'        => $insight->created_at,
                ];
            });

        return response()->json($flags);
    }

    /**
     * PATCH /clinic/ai-insights/{id}/resolve
     * Mark a safety flag as resolved.
     */
    public function resolve(Request $request, int $id)
    {
        $clinicId = $request->user()->clinic->id;

        $insight = AiInsight::where('id', $id)
            ->where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->firstOrFail();

        $insight->update(['resolved_at' => Carbon::now('UTC')]);

        return response()->json(['message' => 'Flag resolved.']);
    }
}
