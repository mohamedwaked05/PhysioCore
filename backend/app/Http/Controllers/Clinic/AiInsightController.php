<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Models\AiInsight;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiInsightController extends Controller
{
    /**
     * GET /clinic/patients/{clientProfileId}/ai-insights
     * Latest progress insight + recent unresolved safety flags for a patient.
     */
    public function show(Request $request, int $clientProfileId)
    {
        $clinicId = $request->user()->clinic->id;

        $hasAccess = AccessRequest::where('clinic_id', $clinicId)
            ->where('client_profile_id', $clientProfileId)
            ->where('status', 'approved')
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Not found.'], 404);
        }

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

        // Get the latest insight ID per client in SQL (avoids loading all rows into PHP)
        $latestIds = AiInsight::where('clinic_id', $clinicId)
            ->where('insight_type', 'progress')
            ->groupBy('client_profile_id')
            ->select(DB::raw('MAX(id) as max_id'))
            ->pluck('max_id');

        $insights = AiInsight::whereIn('id', $latestIds)
            ->select(['client_profile_id', 'adherence_score', 'pain_trend', 'recovery_status'])
            ->get();

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
     * GET /clinic/dashboard/safety-flags?resolved=0|1
     * Safety insights for this clinic — active or resolved, with audit data.
     */
    public function flags(Request $request)
    {
        $clinicId     = $request->user()->clinic->id;
        $showResolved = $request->boolean('resolved', false);

        $flags = AiInsight::where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->when(!$showResolved, fn($q) => $q->whereNull('resolved_at'))
            ->when($showResolved,  fn($q) => $q->whereNotNull('resolved_at'))
            ->with([
                'clientProfile' => fn($q) => $q->select(['id', 'user_id', 'condition_summary'])
                    ->with(['user' => fn($q) => $q->select(['id', 'first_name', 'last_name'])]),
                'resolvedByUser:id,first_name,last_name',
            ])
            ->select(['id', 'client_profile_id', 'flag_reason', 'severity', 'resolved_at', 'resolved_by', 'resolution_note', 'created_at'])
            ->latest()
            ->get()
            ->map(function ($insight) {
                $u         = $insight->clientProfile?->user;
                $firstName = $u?->first_name ?? '';
                $lastName  = $u?->last_name  ?? '';
                $fullName  = trim("{$firstName} {$lastName}") ?: 'Unknown Patient';
                $initials  = strtoupper(($firstName[0] ?? '') . ($lastName[0] ?? '')) ?: '?';
                $resolver  = $insight->resolvedByUser;

                return [
                    'id'                => $insight->id,
                    'client_profile_id' => $insight->client_profile_id,
                    'patient_name'      => $fullName,
                    'initials'          => $initials,
                    'condition'         => $insight->clientProfile?->condition_summary ?? '—',
                    'flag_reason'       => $insight->flag_reason,
                    'severity'          => $insight->severity,
                    'resolved_at'       => $insight->resolved_at,
                    'resolved_by'       => $resolver
                        ? trim($resolver->first_name . ' ' . $resolver->last_name)
                        : null,
                    'resolution_note'   => $insight->resolution_note,
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
        $request->validate([
            'resolution_note' => ['nullable', 'string', 'max:500'],
        ]);

        $clinicId = $request->user()->clinic->id;

        $insight = AiInsight::where('id', $id)
            ->where('clinic_id', $clinicId)
            ->where('safety_flag', true)
            ->firstOrFail();

        $insight->update([
            'resolved_at'     => Carbon::now('UTC'),
            'resolved_by'     => $request->user()->id,
            'resolution_note' => $request->input('resolution_note'),
        ]);

        return response()->json(['message' => 'Flag resolved.']);
    }
}
