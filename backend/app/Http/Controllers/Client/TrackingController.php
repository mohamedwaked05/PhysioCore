<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\RehabPlan;
use App\Models\SessionFeedback;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function status(Request $request)
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
            return response()->json(['message' => 'Not a patient of this clinic.'], 403);
        }

        $plan = RehabPlan::with(['exercises', 'progress'])
            ->where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->first();

        $feedbacks = SessionFeedback::where('client_profile_id', $profile->id)
            ->where('clinic_id', $clinicId)
            ->select(['pain_level', 'session_date'])
            ->orderBy('session_date')
            ->get();

        // ── Adherence & Weekly Days ────────────────────────────
        $adherenceRate = 0;
        $weeklyDays    = [];

        if ($plan) {
            $exercisesByDay = $plan->exercisesByDay();
            $progressByDay  = $plan->progressByDay();

            $daysWithExercises = collect(RehabPlan::DAYS)->filter(fn($d) => count($exercisesByDay[$d]) > 0);
            $completedDays     = $daysWithExercises->filter(fn($d) => $progressByDay[$d]['completed']);

            $adherenceRate = $daysWithExercises->count() > 0
                ? (int) round(($completedDays->count() / $daysWithExercises->count()) * 100)
                : 0;

            $now         = Carbon::now('UTC');
            $startOfWeek = $now->copy()->startOfWeek(Carbon::MONDAY);
            $offsetMap   = ['monday' => 0, 'tuesday' => 1, 'wednesday' => 2, 'thursday' => 3, 'friday' => 4, 'saturday' => 5, 'sunday' => 6];
            $shortMap    = ['monday' => 'M', 'tuesday' => 'T', 'wednesday' => 'W', 'thursday' => 'T', 'friday' => 'F', 'saturday' => 'S', 'sunday' => 'S'];

            foreach (RehabPlan::DAYS as $day) {
                $dayDate     = $startOfWeek->copy()->addDays($offsetMap[$day]);
                $hasExercises = count($exercisesByDay[$day]) > 0;
                $prog         = $progressByDay[$day];
                $isPastOrToday = $dayDate->lte($now->copy()->endOfDay());

                if (!$hasExercises) {
                    $status     = 'rest';
                    $completion = 0;
                } elseif ($prog['completed']) {
                    $status     = 'complete';
                    $completion = 100;
                } elseif ($isPastOrToday) {
                    $status     = 'partial';
                    $completion = 0;
                } else {
                    $status     = 'upcoming';
                    $completion = 0;
                }

                $weeklyDays[] = [
                    'id'         => substr($day, 0, 3),
                    'label'      => ucfirst($day),
                    'short'      => $shortMap[$day],
                    'date'       => $dayDate->format('M j'),
                    'completion' => $completion,
                    'status'     => $status,
                ];
            }
        }

        // ── Pain Trend (last 6 weeks) ─────────────────────────
        // Normalize dates to strings before comparing to avoid Carbon vs string bug
        $sixWeeksAgo = Carbon::now('UTC')->subWeeks(5)->startOfWeek(Carbon::MONDAY);
        $painTrend   = [];

        for ($i = 0; $i < 6; $i++) {
            $weekStart = $sixWeeksAgo->copy()->addWeeks($i)->toDateString();
            $weekEnd   = $sixWeeksAgo->copy()->addWeeks($i)->endOfWeek()->toDateString();

            $avg = $feedbacks
                ->filter(function ($f) use ($weekStart, $weekEnd) {
                    $d = $f->session_date instanceof Carbon
                        ? $f->session_date->toDateString()
                        : substr((string) $f->session_date, 0, 10);
                    return $d >= $weekStart && $d <= $weekEnd && $f->pain_level;
                })
                ->avg('pain_level');

            if ($avg !== null) {
                $painTrend[] = [
                    'week'     => 'W' . ($i + 1),
                    'level'    => round((float) $avg, 1),
                    'maxLevel' => 10,
                ];
            }
        }

        // ── Avg Pain (overall) ────────────────────────────────
        $painValues = $feedbacks->whereNotNull('pain_level')->pluck('pain_level');
        $avgPain    = $painValues->count() > 0 ? round($painValues->avg(), 1) : null;

        // ── Streak (consecutive completed exercise days) ──────
        $streak = 0;
        if ($plan) {
            $exercisesByDay = $plan->exercisesByDay();
            $progressByDay  = $plan->progressByDay();
            $todayName      = strtolower(Carbon::now('UTC')->format('l'));
            $dayIndex       = array_search($todayName, RehabPlan::DAYS);

            if ($dayIndex !== false) {
                for ($i = $dayIndex; $i >= 0; $i--) {
                    $checkDay     = RehabPlan::DAYS[$i];
                    $hasExercises = count($exercisesByDay[$checkDay]) > 0;
                    if ($hasExercises) {
                        if ($progressByDay[$checkDay]['completed']) {
                            $streak++;
                        } else {
                            break;
                        }
                    }
                    // Rest days are skipped without breaking streak
                }
            }
        }

        // ── Milestones ────────────────────────────────────────
        $sessionCount = $feedbacks->count();

        $firstFeedback = $feedbacks->first();
        $lastFeedback  = $feedbacks->last();
        $painReduction = null;
        if ($firstFeedback?->pain_level && $lastFeedback?->pain_level) {
            $diff          = $firstFeedback->pain_level - $lastFeedback->pain_level;
            $pct           = $firstFeedback->pain_level > 0 ? round(($diff / $firstFeedback->pain_level) * 100) : 0;
            $painReduction = ($pct >= 0 ? '−' : '+') . abs($pct) . '% from start';
        }

        $milestones = [
            [
                'id'       => 1,
                'type'     => 'streak',
                'label'    => 'Current Streak',
                'value'    => $streak . ' day' . ($streak !== 1 ? 's' : ''),
                'achieved' => $streak > 0,
            ],
            [
                'id'       => 2,
                'type'     => 'sessions',
                'label'    => 'Sessions Completed',
                'value'    => $sessionCount . ' session' . ($sessionCount !== 1 ? 's' : ''),
                'achieved' => $sessionCount > 0,
            ],
            [
                'id'       => 3,
                'type'     => 'pain',
                'label'    => 'Pain Reduction',
                'value'    => $painReduction ?? 'No data yet',
                'achieved' => $painReduction !== null && str_starts_with($painReduction, '−'),
            ],
        ];

        return response()->json([
            'adherence_rate' => $adherenceRate,
            'avg_pain'       => $avgPain,
            'pain_trend'     => $painTrend,
            'weekly_days'    => $weeklyDays,
            'milestones'     => $milestones,
        ]);
    }
}
