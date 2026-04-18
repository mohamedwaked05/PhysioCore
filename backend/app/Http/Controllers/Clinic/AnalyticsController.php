<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Models\SessionFeedback;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $clinicId = $request->user()->clinic->id;

        $data = Cache::remember("clinic_analytics_{$clinicId}", 90, function () use ($clinicId) {
            return $this->compute($clinicId);
        });

        return response()->json($data);
    }

    private function compute(int $clinicId): array
    {
        $now         = Carbon::now('UTC');
        $startOfWeek = $now->copy()->startOfWeek(Carbon::MONDAY);
        $sixWeeksAgo = $now->copy()->subWeeks(5)->startOfWeek(Carbon::MONDAY);

        $activePatients = AccessRequest::where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->count();

        // ── Build week boundaries once ────────────────────────
        $weeks = [];
        for ($i = 0; $i < 6; $i++) {
            $weeks[$i] = [
                'start' => $sixWeeksAgo->copy()->addWeeks($i)->toDateString(),
                'end'   => $sixWeeksAgo->copy()->addWeeks($i)->endOfWeek()->toDateString(),
                'label' => 'W' . ($i + 1),
            ];
        }

        // ── Single query: distinct patients + avg pain per week ─
        // Fetch only what we need — no text columns
        $rawFeedbacks = SessionFeedback::where('clinic_id', $clinicId)
            ->where('session_date', '>=', $sixWeeksAgo->toDateString())
            ->select(['client_profile_id', 'pain_level', 'session_date'])
            ->get();

        // Group by week index in one pass (avoids 12 repeated filter loops)
        $byWeek = array_fill(0, 6, []);
        foreach ($rawFeedbacks as $f) {
            $d = $f->session_date instanceof Carbon
                ? $f->session_date->toDateString()
                : substr((string) $f->session_date, 0, 10);

            for ($i = 0; $i < 6; $i++) {
                if ($d >= $weeks[$i]['start'] && $d <= $weeks[$i]['end']) {
                    $byWeek[$i][] = ['cid' => $f->client_profile_id, 'pain' => $f->pain_level];
                    break;
                }
            }
        }

        // Build adherence + pain trend in a single pass over grouped data
        $adherenceTrend = [];
        $painTrend      = [];
        for ($i = 0; $i < 6; $i++) {
            $rows = $byWeek[$i];

            $distinctPatients = count(array_unique(array_column($rows, 'cid')));
            $rate             = $activePatients > 0
                ? min((int) round(($distinctPatients / $activePatients) * 100), 100)
                : 0;
            $adherenceTrend[] = ['label' => $weeks[$i]['label'], 'value' => $rate];

            $painValues = array_filter(array_column($rows, 'pain'), fn($v) => $v !== null && $v > 0);
            $avgPain    = count($painValues) > 0 ? array_sum($painValues) / count($painValues) : 0;
            $painTrend[] = ['label' => $weeks[$i]['label'], 'value' => $avgPain > 0 ? (int) round($avgPain * 10) : 0];
        }

        // ── Activity: single DB aggregation (replaces 7 per-day queries) ──
        $activityRaw = SessionFeedback::where('clinic_id', $clinicId)
            ->whereBetween('session_date', [$startOfWeek->toDateString(), $startOfWeek->copy()->endOfWeek()->toDateString()])
            ->select(DB::raw('session_date, COUNT(*) as cnt'))
            ->groupBy('session_date')
            ->pluck('cnt', 'session_date');

        $dayLabels   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $activityData = [];
        for ($i = 0; $i < 7; $i++) {
            $day          = $startOfWeek->copy()->addDays($i)->toDateString();
            $activityData[] = ['label' => $dayLabels[$i], 'value' => (int) ($activityRaw[$day] ?? 0)];
        }

        // ── Summary stats ─────────────────────────────────────
        $latestAdherence  = $adherenceTrend[5]['value'] ?? 0;
        $prevAdherence    = $adherenceTrend[4]['value'] ?? 0;
        $thisWeekSessions = array_sum(array_column($activityData, 'value'));

        $lastWeekSessions = SessionFeedback::where('clinic_id', $clinicId)
            ->whereBetween('session_date', [
                $startOfWeek->copy()->subWeek()->toDateString(),
                $startOfWeek->copy()->subDay()->toDateString(),
            ])
            ->count();

        // Pain diff: first week vs current week (using already-grouped data)
        $w1Pain   = array_filter(array_column($byWeek[0], 'pain'), fn($v) => $v !== null && $v > 0);
        $w6Pain   = array_filter(array_column($byWeek[5], 'pain'), fn($v) => $v !== null && $v > 0);
        $earlyAvg = count($w1Pain) > 0 ? array_sum($w1Pain) / count($w1Pain) : null;
        $lateAvg  = count($w6Pain) > 0 ? array_sum($w6Pain) / count($w6Pain) : null;
        $painDiff = ($earlyAvg && $lateAvg) ? round($earlyAvg - $lateAvg, 1) : null;

        return [
            'adherence_trend' => $adherenceTrend,
            'pain_trend'      => $painTrend,
            'activity_data'   => $activityData,
            'summary'         => [
                'current_adherence'        => $latestAdherence,
                'adherence_diff'           => $latestAdherence - $prevAdherence,
                'total_sessions_this_week' => $thisWeekSessions,
                'sessions_diff'            => $thisWeekSessions - $lastWeekSessions,
                'avg_pain'                 => $lateAvg ? round($lateAvg, 1) : null,
                'pain_diff'                => $painDiff,
            ],
        ];
    }
}
