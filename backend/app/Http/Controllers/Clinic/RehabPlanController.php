<?php

namespace App\Http\Controllers\Clinic;

use App\Data\PredefinedExercises;
use App\Events\RehabPlanUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\RehabPlan\StoreRehabPlanRequest;
use App\Models\AccessRequest;
use App\Models\RehabPlan;
use App\Models\RehabPlanExercise;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RehabPlanController extends Controller
{
    /* GET /clinic/plans — all clients with their plans */
    public function index(Request $request)
    {
        $clinic = $request->user()->clinic;

        $result = Cache::remember("clinic_plans_{$clinic->id}", 30, function () use ($clinic) {
            $plans = RehabPlan::where('clinic_id', $clinic->id)
                ->with(['exercises', 'progress', 'clientProfile.user'])
                ->orderBy('client_profile_id')
                ->orderBy('week_number')
                ->get();

            $grouped = $plans->groupBy('client_profile_id');

            return $grouped->map(function ($clientPlans, $clientProfileId) {
                $first = $clientPlans->first();
                $cp    = $first->clientProfile;
                $user  = $cp?->user;
                return [
                    'client_profile_id' => (int) $clientProfileId,
                    'client' => [
                        'id'                => (int) $clientProfileId,
                        'name'              => trim(($user?->first_name ?? '') . ' ' . ($user?->last_name ?? '')) ?: 'Unknown',
                        'condition_summary' => $cp?->condition_summary ?? '—',
                    ],
                    'plans' => $clientPlans->map(fn($p) => $this->formatForClinic($p))->values()->toArray(),
                ];
            })->values()->toArray();
        });

        return response()->json($result);
    }

    /* GET /clinic/patients/{clientProfileId}/rehab-plan */
    public function showForPatient(Request $request, int $clientProfileId)
    {
        $clinic = $request->user()->clinic;

        $approved = AccessRequest::where('clinic_id', $clinic->id)
            ->where('client_profile_id', $clientProfileId)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'This patient is not under your care.'], 403);
        }

        $plan = RehabPlan::where('clinic_id', $clinic->id)
            ->where('client_profile_id', $clientProfileId)
            ->with(['exercises', 'progress'])
            ->latest()
            ->first();

        if (!$plan) {
            return response()->json(null);
        }

        return response()->json($this->formatForClinic($plan));
    }

    /* POST /clinic/rehab-plans */
    public function store(StoreRehabPlanRequest $request)
    {
        $clinic = $request->user()->clinic;

        $approved = AccessRequest::where('clinic_id', $clinic->id)
            ->where('client_profile_id', $request->client_profile_id)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'You do not have an approved patient with this profile.'], 403);
        }

        // Auto-calculate week_number if not provided
        $weekNumber = $request->input('week_number');
        if (!$weekNumber) {
            $maxWeek    = RehabPlan::where('clinic_id', $clinic->id)
                ->where('client_profile_id', $request->client_profile_id)
                ->max('week_number');
            $weekNumber = ($maxWeek ?? 0) + 1;
        }

        // Auto-calculate start/end dates if not provided by frontend
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        if (!$startDate) {
            $latestPlan = RehabPlan::where('clinic_id', $clinic->id)
                ->where('client_profile_id', $request->client_profile_id)
                ->whereNotNull('end_date')
                ->latest()
                ->first(['end_date']);

            if ($latestPlan?->end_date) {
                $start     = $latestPlan->end_date->addDay();
                $startDate = $start->toDateString();
                $endDate   = $start->copy()->addDays(6)->toDateString();
            } else {
                $startDate = Carbon::today('UTC')->toDateString();
                $endDate   = Carbon::today('UTC')->addDays(6)->toDateString();
            }
        }

        $plan = RehabPlan::create([
            'clinic_id'         => $clinic->id,
            'client_profile_id' => $request->client_profile_id,
            'injury_type'       => $request->injury_type,
            'week_number'       => $weekNumber,
            'start_date'        => $startDate,
            'end_date'          => $endDate,
        ]);

        $plan->exercises()->createMany(
            collect($request->exercises)->map(fn($e) => [
                'day_of_week'          => $e['day_of_week'],
                'name'                 => $e['name'],
                'sets'                 => $e['sets'],
                'reps'                 => $e['reps'],
                'notes'                => $e['notes'] ?? null,
                'alternative_exercise' => $e['alternative_exercise'] ?? null,
            ])->toArray()
        );

        $plan->load(['exercises', 'progress']);

        Cache::forget("clinic_plans_{$clinic->id}");
        Cache::forget("rehab_plan_{$plan->client_profile_id}_{$clinic->id}");

        broadcast(new RehabPlanUpdated((int) $plan->client_profile_id, $this->buildClientPayload($plan)));

        return response()->json($this->formatForClinic($plan), 201);
    }

    /* PUT /clinic/rehab-plans/{rehabPlan} */
    public function update(Request $request, RehabPlan $rehabPlan)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'injury_type'                      => ['sometimes', 'string', 'max:100'],
            'week_number'                      => ['sometimes', 'integer', 'min:1', 'max:52'],
            'start_date'                       => ['nullable', 'date'],
            'end_date'                         => ['nullable', 'date', 'after_or_equal:start_date'],
            'exercises'                        => ['sometimes', 'array', 'min:1'],
            'exercises.*.day_of_week'          => ['required_with:exercises', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'exercises.*.name'                 => ['required_with:exercises', 'string', 'max:200'],
            'exercises.*.sets'                 => ['required_with:exercises', 'integer', 'min:1', 'max:20'],
            'exercises.*.reps'                 => ['required_with:exercises', 'integer', 'min:1', 'max:999'],
            'exercises.*.notes'                => ['nullable', 'string', 'max:500'],
            'exercises.*.alternative_exercise' => ['nullable', 'string', 'max:200'],
        ]);

        // Update plan-level fields
        $planFields = [];
        if (isset($data['injury_type']))                    $planFields['injury_type'] = $data['injury_type'];
        if (isset($data['week_number']))                    $planFields['week_number'] = $data['week_number'];
        if (array_key_exists('start_date', $data))         $planFields['start_date']  = $data['start_date'];
        if (array_key_exists('end_date', $data))           $planFields['end_date']    = $data['end_date'];
        if (!empty($planFields)) $rehabPlan->update($planFields);

        if (isset($data['exercises'])) {
            $rehabPlan->load('progress');

            // Silently skip days the client has already completed (locked days)
            $completedDays = $rehabPlan->progress
                ->where('completed', true)
                ->pluck('day_of_week')
                ->toArray();

            $updateable = collect($data['exercises'])
                ->filter(fn($e) => !in_array($e['day_of_week'], $completedDays))
                ->values();

            if ($updateable->isNotEmpty()) {
                $rehabPlan->exercises()
                    ->whereIn('day_of_week', $updateable->pluck('day_of_week')->unique()->toArray())
                    ->delete();

                $rehabPlan->exercises()->createMany(
                    $updateable->map(fn($e) => [
                        'day_of_week'          => $e['day_of_week'],
                        'name'                 => $e['name'],
                        'sets'                 => $e['sets'],
                        'reps'                 => $e['reps'],
                        'notes'                => $e['notes'] ?? null,
                        'alternative_exercise' => $e['alternative_exercise'] ?? null,
                    ])->toArray()
                );
            }
        }

        $rehabPlan->load(['exercises', 'progress']);

        Cache::forget("clinic_plans_{$rehabPlan->clinic_id}");
        Cache::forget("rehab_plan_{$rehabPlan->client_profile_id}_{$rehabPlan->clinic_id}");

        broadcast(new RehabPlanUpdated($rehabPlan->client_profile_id, $this->buildClientPayload($rehabPlan)));

        return response()->json($this->formatForClinic($rehabPlan));
    }

    /* DELETE /clinic/rehab-plans/{rehabPlan} */
    public function destroy(Request $request, RehabPlan $rehabPlan)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $clientProfileId = $rehabPlan->client_profile_id;
        $clinicId        = $rehabPlan->clinic_id;
        $planId          = $rehabPlan->id;

        $rehabPlan->delete();

        Cache::forget("clinic_plans_{$clinicId}");
        Cache::forget("rehab_plan_{$clientProfileId}_{$clinicId}");

        // Notify the client in real-time so their plan view clears immediately
        broadcast(new RehabPlanUpdated($clientProfileId, ['deleted' => true, 'id' => $planId]));

        return response()->json(null, 204);
    }

    /* POST /clinic/rehab-plans/{rehabPlan}/exercises */
    public function storeExercise(Request $request, RehabPlan $rehabPlan)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'day_of_week'          => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'name'                 => ['required', 'string', 'max:200'],
            'sets'                 => ['required', 'integer', 'min:1', 'max:20'],
            'reps'                 => ['required', 'integer', 'min:1', 'max:999'],
            'notes'                => ['nullable', 'string', 'max:500'],
            'alternative_exercise' => ['nullable', 'string', 'max:200'],
        ]);

        $exercise = $rehabPlan->exercises()->create($data);

        Cache::forget("clinic_plans_{$rehabPlan->clinic_id}");
        Cache::forget("rehab_plan_{$rehabPlan->client_profile_id}_{$rehabPlan->clinic_id}");

        return response()->json($exercise, 201);
    }

    /* PUT /clinic/rehab-plans/{rehabPlan}/exercises/{exercise} */
    public function updateExercise(Request $request, RehabPlan $rehabPlan, RehabPlanExercise $exercise)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id || $exercise->rehab_plan_id !== $rehabPlan->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'day_of_week'          => ['sometimes', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'name'                 => ['sometimes', 'string', 'max:200'],
            'sets'                 => ['sometimes', 'integer', 'min:1', 'max:20'],
            'reps'                 => ['sometimes', 'integer', 'min:1', 'max:999'],
            'notes'                => ['nullable', 'string', 'max:500'],
            'alternative_exercise' => ['nullable', 'string', 'max:200'],
        ]);

        $exercise->update($data);

        Cache::forget("clinic_plans_{$rehabPlan->clinic_id}");
        Cache::forget("rehab_plan_{$rehabPlan->client_profile_id}_{$rehabPlan->clinic_id}");

        return response()->json($exercise);
    }

    /* DELETE /clinic/rehab-plans/{rehabPlan}/exercises/{exercise} */
    public function destroyExercise(Request $request, RehabPlan $rehabPlan, RehabPlanExercise $exercise)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id || $exercise->rehab_plan_id !== $rehabPlan->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $clinicId        = $rehabPlan->clinic_id;
        $clientProfileId = $rehabPlan->client_profile_id;

        $exercise->delete();

        Cache::forget("clinic_plans_{$clinicId}");
        Cache::forget("rehab_plan_{$clientProfileId}_{$clinicId}");

        return response()->json(null, 204);
    }

    /* POST /clinic/rehab-plans/{rehabPlan}/copy */
    public function copy(Request $request, RehabPlan $rehabPlan)
    {
        $clinic = $request->user()->clinic;

        if ($rehabPlan->clinic_id !== $clinic->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'client_profile_id' => ['required', 'integer', 'exists:client_profiles,id'],
        ]);

        $approved = AccessRequest::where('clinic_id', $clinic->id)
            ->where('client_profile_id', $data['client_profile_id'])
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'Target patient is not under your care.'], 403);
        }

        $newPlan = RehabPlan::create([
            'clinic_id'         => $clinic->id,
            'client_profile_id' => $data['client_profile_id'],
            'injury_type'       => $rehabPlan->injury_type,
            'week_number'       => $rehabPlan->week_number,
            'start_date'        => $rehabPlan->start_date,
            'end_date'          => $rehabPlan->end_date,
        ]);

        $rehabPlan->exercises->each(fn($ex) => $newPlan->exercises()->create([
            'day_of_week'          => $ex->day_of_week,
            'name'                 => $ex->name,
            'sets'                 => $ex->sets,
            'reps'                 => $ex->reps,
            'notes'                => $ex->notes,
            'alternative_exercise' => $ex->alternative_exercise,
        ]));

        $newPlan->load(['exercises', 'progress']);

        Cache::forget("clinic_plans_{$clinic->id}");
        Cache::forget("rehab_plan_{$data['client_profile_id']}_{$clinic->id}");

        return response()->json($this->formatForClinic($newPlan), 201);
    }

    /* GET /clinic/exercise-library?injury_type=acl */
    public function exerciseLibrary(Request $request)
    {
        $injuryType = $request->get('injury_type');

        $exercises = $injuryType
            ? PredefinedExercises::byInjuryType($injuryType)
            : PredefinedExercises::all();

        return response()->json($exercises);
    }

    private function formatForClinic(RehabPlan $plan): array
    {
        $data = $plan->toArray();
        $data['exercises_by_day'] = $plan->exercisesByDay();
        if ($plan->relationLoaded('progress')) {
            $data['progress_by_day'] = $plan->progressByDay();
        }
        return $data;
    }

    private function buildClientPayload(RehabPlan $plan): array
    {
        $data = $plan->toArray();
        $data['exercises_by_day'] = $plan->exercisesByDay();
        $data['progress']         = $plan->progressByDay();
        return $data;
    }
}
