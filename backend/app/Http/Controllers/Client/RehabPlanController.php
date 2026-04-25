<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Models\ClientProfile;
use App\Models\RehabPlan;
use App\Models\RehabPlanProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class RehabPlanController extends Controller
{
    /* GET /client/rehab-plan?clinic_id=X */
    public function show(Request $request)
    {
        $request->validate([
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
        ]);

        $clientProfile = ClientProfile::where('user_id', $request->user()->id)->first();

        if (!$clientProfile) {
            return response()->json(['message' => 'Client profile not found.'], 404);
        }

        $approved = AccessRequest::where('clinic_id', $request->clinic_id)
            ->where('client_profile_id', $clientProfile->id)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'No approved access with this clinic.'], 403);
        }

        $cacheKey = "rehab_plan_{$clientProfile->id}_{$request->clinic_id}";
        $planData = Cache::remember($cacheKey, 30, function () use ($request, $clientProfile) {
            $plan = RehabPlan::where('clinic_id', $request->clinic_id)
                ->where('client_profile_id', $clientProfile->id)
                ->with(['exercises', 'progress'])
                ->latest()
                ->first();

            return $plan ? $this->formatForClient($plan) : null;
        });

        return response()->json($planData);
    }

    /* POST /client/rehab-plan/progress */
    public function markDay(Request $request)
    {
        $request->validate([
            'rehab_plan_id' => ['required', 'integer', 'exists:rehab_plans,id'],
            'day_of_week'   => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
        ]);

        $clientProfile = ClientProfile::where('user_id', $request->user()->id)->first();

        if (!$clientProfile) {
            return response()->json(['message' => 'Client profile not found.'], 404);
        }

        $plan = RehabPlan::where('id', $request->rehab_plan_id)
            ->where('client_profile_id', $clientProfile->id)
            ->first();

        if (!$plan) {
            return response()->json(['message' => 'Plan not found.'], 404);
        }

        $progress = RehabPlanProgress::updateOrCreate(
            [
                'rehab_plan_id'     => $plan->id,
                'day_of_week'       => $request->day_of_week,
            ],
            [
                'client_profile_id' => $clientProfile->id,
                'completed'         => true,
                'completed_at'      => Carbon::now(),
            ]
        );

        Cache::forget("rehab_plan_{$clientProfile->id}_{$plan->clinic_id}");

        return response()->json($progress, 201);
    }

    /* DELETE /client/rehab-plan/progress */
    public function resetDay(Request $request)
    {
        $request->validate([
            'rehab_plan_id' => ['required', 'integer', 'exists:rehab_plans,id'],
            'day_of_week'   => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
        ]);

        $clientProfile = ClientProfile::where('user_id', $request->user()->id)->first();

        if (!$clientProfile) {
            return response()->json(['message' => 'Client profile not found.'], 404);
        }

        $plan = RehabPlan::where('id', $request->rehab_plan_id)
            ->where('client_profile_id', $clientProfile->id)
            ->first();

        if (!$plan) {
            return response()->json(['message' => 'Plan not found.'], 404);
        }

        RehabPlanProgress::where('rehab_plan_id', $request->rehab_plan_id)
            ->where('client_profile_id', $clientProfile->id)
            ->where('day_of_week', $request->day_of_week)
            ->delete();

        Cache::forget("rehab_plan_{$clientProfile->id}_{$plan->clinic_id}");

        return response()->json(null, 204);
    }

    private function formatForClient(RehabPlan $plan): array
    {
        $data                     = $plan->toArray();
        $data['exercises_by_day'] = $plan->exercisesByDay();
        $data['progress']         = $plan->progressByDay();
        return $data;
    }
}
