<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Models\ClientProfile;
use App\Models\RehabPlan;
use App\Models\SessionFeedback;
use Illuminate\Http\Request;

class PatientProfileController extends Controller
{
    public function show(Request $request, int $clientProfileId)
    {
        $clinic = $request->user()->clinic;

        $access = AccessRequest::where('clinic_id', $clinic->id)
            ->where('client_profile_id', $clientProfileId)
            ->where('status', 'approved')
            ->first();

        if (!$access) {
            return response()->json(['message' => 'Patient not under your care.'], 403);
        }

        $profile = ClientProfile::with('user:id,first_name,last_name,email,cover_photo_url')
            ->find($clientProfileId);

        if (!$profile) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        $user     = $profile->user;
        $fullName = trim(($user?->first_name ?? '') . ' ' . ($user?->last_name ?? ''));
        $initials = strtoupper(($user?->first_name[0] ?? '') . ($user?->last_name[0] ?? '')) ?: '?';

        // Sessions completed (for this clinic)
        $sessionsCompleted = SessionFeedback::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinic->id)
            ->count();

        // Average pain from last 10 sessions
        $avgPain = SessionFeedback::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinic->id)
            ->whereNotNull('pain_level')
            ->latest()
            ->limit(10)
            ->avg('pain_level');

        // Active safety flags
        $activeFlags = SessionFeedback::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinic->id)
            ->where('safety_flag', true)
            ->where('resolved', false)
            ->count();

        // Latest plan title
        $latestPlan = RehabPlan::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinic->id)
            ->latest()
            ->first(['injury_type', 'week_number']);

        $planLabel = null;
        if ($latestPlan) {
            $injury    = str_replace('_', ' ', $latestPlan->injury_type ?? '');
            $injury    = ucwords($injury);
            $planLabel = "Week {$latestPlan->week_number} — {$injury}";
        }

        return response()->json([
            'id'                => $clientProfileId,
            'name'              => $fullName ?: 'Unknown',
            'initials'          => $initials,
            'email'             => $user?->email,
            'gender'            => $profile->gender ?? null,
            'profile_photo_url' => $profile->profile_photo_url,
            'cover_photo_url'   => $user?->cover_photo_url,
            'condition'         => $profile->condition_summary,
            'sessions_completed'=> $sessionsCompleted,
            'avg_pain'          => $avgPain ? round($avgPain, 1) : null,
            'active_flags'      => $activeFlags,
            'plan'              => $planLabel,
            'approved_since'    => $access->updated_at,
        ]);
    }
}
