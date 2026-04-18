<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('AI_SERVICE_URL', 'http://localhost:8001'), '/');
    }

    /**
     * Analyze a single session for safety flags.
     * Returns array with safety_flag, flag_reason, severity — or null if service unreachable.
     */
    public function analyzeSession(array $payload): ?array
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/analyze-session", $payload);
            if ($response->successful()) {
                return $response->json();
            }
            Log::warning('AI /analyze-session returned ' . $response->status());
        } catch (\Throwable $e) {
            Log::warning('AI service unreachable (analyze-session): ' . $e->getMessage());
        }
        return null;
    }

    /**
     * Analyze aggregated progress logs.
     * Returns array with adherence_score, pain_trend, recovery_status — or null if unreachable.
     */
    public function analyzeProgress(array $payload): ?array
    {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/analyze-progress", $payload);
            if ($response->successful()) {
                return $response->json();
            }
            Log::warning('AI /analyze-progress returned ' . $response->status());
        } catch (\Throwable $e) {
            Log::warning('AI service unreachable (analyze-progress): ' . $e->getMessage());
        }
        return null;
    }
}
