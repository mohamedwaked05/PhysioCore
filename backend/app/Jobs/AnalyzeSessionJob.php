<?php

namespace App\Jobs;

use App\Http\Controllers\Client\AiInsightController;
use App\Models\AiInsight;
use App\Models\ClientProfile;
use App\Models\PainEffortLog;
use App\Services\AiService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeSessionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 60;

    public function __construct(
        public readonly int    $clientProfileId,
        public readonly int    $clinicId,
        public readonly float  $painLevel,
        public readonly float  $effortLevel,
        public readonly int    $exercisesCompleted,
        public readonly string $today,
        public readonly int    $feedbackId,
    ) {}

    public function handle(AiService $ai): void
    {
        $profile = ClientProfile::find($this->clientProfileId);
        if (!$profile) return;

        $recentPain = PainEffortLog::where('client_profile_id', $this->clientProfileId)
            ->where('clinic_id', $this->clinicId)
            ->where('session_date', '<', $this->today)
            ->where('session_date', '>=', Carbon::now('UTC')->subDays(14)->toDateString())
            ->orderBy('session_date')
            ->pluck('pain_level')
            ->map(fn($v) => (float) $v)
            ->all();

        $result = $ai->analyzeSession([
            'client_id'            => $this->clientProfileId,
            'clinic_id'            => $this->clinicId,
            'pain_level'           => $this->painLevel,
            'effort_level'         => $this->effortLevel,
            'completed_exercises'  => $this->exercisesCompleted,
            'previous_pain_levels' => $recentPain,
        ]);

        if (!$result || !$result['safety_flag']) return;

        $insight = AiInsight::firstOrCreate(
            [
                'session_feedback_id' => $this->feedbackId,
                'insight_type'        => 'session',
            ],
            [
                'client_profile_id' => $this->clientProfileId,
                'clinic_id'         => $this->clinicId,
                'safety_flag'       => true,
                'flag_reason'       => $result['flag_reason'],
                'severity'          => $result['severity'] ?? null,
            ]
        );

        if ($insight->wasRecentlyCreated) {
            app(AiInsightController::class)->notifyClinic(
                $profile,
                $this->clinicId,
                $result,
                isCritical: ($result['severity'] ?? '') === 'critical'
            );
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::warning('AnalyzeSessionJob failed', [
            'client_profile_id' => $this->clientProfileId,
            'feedback_id'       => $this->feedbackId,
            'error'             => $e->getMessage(),
        ]);
    }
}
