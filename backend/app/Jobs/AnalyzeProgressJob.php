<?php

namespace App\Jobs;

use App\Models\AiInsight;
use App\Models\ExerciseLog;
use App\Models\PainEffortLog;
use App\Models\SessionFeedback;
use App\Services\AiService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeProgressJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 30;

    public function __construct(
        public readonly int    $clientProfileId,
        public readonly int    $clinicId,
        public readonly string $today,
    ) {}

    public function handle(AiService $ai): void
    {
        $twoWeeksAgo = Carbon::now('UTC')->subDays(14)->toDateString();

        $painLogs = PainEffortLog::where('client_profile_id', $this->clientProfileId)
            ->where('clinic_id', $this->clinicId)
            ->where('session_date', '>=', $twoWeeksAgo)
            ->orderBy('session_date')
            ->select(['session_date', 'pain_level'])
            ->get()
            ->map(fn($r) => [
                'date'       => $r->session_date instanceof Carbon
                    ? $r->session_date->toDateString()
                    : substr((string) $r->session_date, 0, 10),
                'pain_level' => (float) $r->pain_level,
            ])
            ->all();

        $sessionFeedbacks = SessionFeedback::where('client_profile_id', $this->clientProfileId)
            ->where('clinic_id', $this->clinicId)
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
        } else {
            $exerciseLogs = ExerciseLog::where('client_profile_id', $this->clientProfileId)
                ->where('session_date', '>=', $twoWeeksAgo)
                ->selectRaw('session_date, COUNT(*) as completed_count')
                ->groupBy('session_date')
                ->orderBy('session_date')
                ->get()
                ->map(fn($r) => [
                    'date'            => $r->session_date instanceof Carbon
                        ? $r->session_date->toDateString()
                        : substr((string) $r->session_date, 0, 10),
                    'completed_count' => (int) $r->completed_count,
                    'assigned_count'  => (int) $r->completed_count,
                ])
                ->all();
        }

        $result = $ai->analyzeProgress([
            'client_id'     => $this->clientProfileId,
            'clinic_id'     => $this->clinicId,
            'pain_logs'     => $painLogs,
            'exercise_logs' => $exerciseLogs,
        ]);

        if ($result) {
            AiInsight::create([
                'client_profile_id' => $this->clientProfileId,
                'clinic_id'         => $this->clinicId,
                'insight_type'      => 'progress',
                'adherence_score'   => $result['adherence_score'],
                'pain_trend'        => $result['pain_trend'],
                'recovery_status'   => $result['recovery_status'],
                'safety_flag'       => false,
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::warning('AnalyzeProgressJob failed', [
            'client_profile_id' => $this->clientProfileId,
            'clinic_id'         => $this->clinicId,
            'error'             => $e->getMessage(),
        ]);
    }
}
