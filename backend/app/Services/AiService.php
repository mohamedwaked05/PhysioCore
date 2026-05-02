<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.ai.url', 'http://localhost:8001'), '/');
        $this->apiKey  = config('services.ai.key', '');
    }

    private function client(): \Illuminate\Http\Client\PendingRequest
    {
        $headers = ['Accept' => 'application/json'];
        if ($this->apiKey) {
            $headers['X-Api-Key'] = $this->apiKey;
        }
        return Http::withHeaders($headers);
    }

    /**
     * Analyze a single session for safety flags.
     * Tries the external AI service first; falls back to rule-based logic.
     */
    public function analyzeSession(array $payload): ?array
    {
        try {
            $response = $this->client()->timeout(5)->post("{$this->baseUrl}/analyze-session", $payload);
            if ($response->successful()) {
                return $response->json();
            }
            Log::warning('AI /analyze-session returned ' . $response->status());
        } catch (\Throwable $e) {
            Log::info('AI service unavailable, using rule-based fallback for session analysis.');
        }

        return $this->sessionRules($payload);
    }

    /**
     * Analyze aggregated progress logs.
     * Tries the external AI service first; falls back to rule-based logic.
     */
    public function analyzeProgress(array $payload): ?array
    {
        try {
            $response = $this->client()->timeout(10)->post("{$this->baseUrl}/analyze-progress", $payload);
            if ($response->successful()) {
                return $response->json();
            }
            Log::warning('AI /analyze-progress returned ' . $response->status());
        } catch (\Throwable $e) {
            Log::info('AI service unavailable, using rule-based fallback for progress analysis.');
        }

        return $this->progressRules($payload);
    }

    // ── Rule-based fallbacks ──────────────────────────────────────────────────

    private function sessionRules(array $payload): array
    {
        $pain     = (float) ($payload['pain_level']   ?? 0);
        $effort   = (float) ($payload['effort_level'] ?? 0);
        $prevPain = array_values(array_filter((array) ($payload['previous_pain_levels'] ?? []), 'is_numeric'));

        $recentAvg = count($prevPain) > 0
            ? array_sum($prevPain) / count($prevPain)
            : $pain;

        $safetyFlag = false;
        $flagReason = null;
        $severity   = null;

        if ($pain >= 8) {
            $safetyFlag = true;
            $severity   = 'critical';
            $flagReason = "Severe pain reported (level {$pain}/10). Immediate clinical assessment recommended.";
        } elseif ($pain >= 6 && $pain >= $recentAvg + 2) {
            $safetyFlag = true;
            $severity   = 'warning';
            $flagReason = "Significant pain increase detected (current: {$pain}/10, recent average: " . round($recentAvg, 1) . "/10). Review recommended.";
        } elseif ($pain >= 7 && $effort >= 9) {
            $safetyFlag = true;
            $severity   = 'warning';
            $flagReason = "High pain ({$pain}/10) combined with maximum effort ({$effort}/10) reported. Monitor closely.";
        }

        return [
            'safety_flag' => $safetyFlag,
            'flag_reason' => $flagReason,
            'severity'    => $severity,
        ];
    }

    private function progressRules(array $payload): array
    {
        $painLogs     = (array) ($payload['pain_logs']     ?? []);
        $exerciseLogs = (array) ($payload['exercise_logs'] ?? []);

        // Adherence
        $totalAssigned  = array_sum(array_column($exerciseLogs, 'assigned_count'));
        $totalCompleted = array_sum(array_column($exerciseLogs, 'completed_count'));
        $adherence = $totalAssigned > 0
            ? round(($totalCompleted / $totalAssigned) * 100)
            : 100;

        // Pain trend (compare first half avg vs second half avg)
        $painTrend = 'stable';
        $painValues = array_column($painLogs, 'pain_level');
        if (count($painValues) >= 4) {
            $mid   = (int) floor(count($painValues) / 2);
            $first = array_sum(array_slice($painValues, 0, $mid)) / $mid;
            $last  = array_sum(array_slice($painValues, $mid))    / ($mid);
            if ($last < $first - 1)      $painTrend = 'improving';
            elseif ($last > $first + 1)  $painTrend = 'worsening';
        } elseif (count($painValues) >= 2) {
            $first = (float) $painValues[0];
            $last  = (float) end($painValues);
            if ($last < $first - 1)      $painTrend = 'improving';
            elseif ($last > $first + 1)  $painTrend = 'worsening';
        }

        // Recovery status
        if ($adherence >= 80 && in_array($painTrend, ['improving', 'stable'])) {
            $recoveryStatus = 'on_track';
        } elseif ($adherence < 50 || $painTrend === 'worsening') {
            $recoveryStatus = 'at_risk';
        } else {
            $recoveryStatus = 'moderate';
        }

        return [
            'adherence_score'  => $adherence,
            'pain_trend'       => $painTrend,
            'recovery_status'  => $recoveryStatus,
        ];
    }
}
