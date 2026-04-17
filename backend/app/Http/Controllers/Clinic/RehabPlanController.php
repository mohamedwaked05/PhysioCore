<?php

namespace App\Http\Controllers\Clinic;

use App\Data\PredefinedExercises;
use App\Http\Controllers\Controller;
use App\Http\Requests\RehabPlan\StoreRehabPlanRequest;
use App\Models\AccessRequest;
use App\Models\RehabPlan;
use App\Models\RehabPlanExercise;
use Illuminate\Http\Request;

class RehabPlanController extends Controller
{
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
            ->with('exercises')
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

        $plan = RehabPlan::create([
            'clinic_id'         => $clinic->id,
            'client_profile_id' => $request->client_profile_id,
            'injury_type'       => $request->injury_type,
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

        $plan->load('exercises');

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
            'exercises'                        => ['sometimes', 'array', 'min:1'],
            'exercises.*.day_of_week'          => ['required_with:exercises', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'exercises.*.name'                 => ['required_with:exercises', 'string', 'max:200'],
            'exercises.*.sets'                 => ['required_with:exercises', 'integer', 'min:1', 'max:20'],
            'exercises.*.reps'                 => ['required_with:exercises', 'integer', 'min:1', 'max:999'],
            'exercises.*.notes'                => ['nullable', 'string', 'max:500'],
            'exercises.*.alternative_exercise' => ['nullable', 'string', 'max:200'],
        ]);

        if (isset($data['injury_type'])) {
            $rehabPlan->update(['injury_type' => $data['injury_type']]);
        }

        if (isset($data['exercises'])) {
            $rehabPlan->exercises()->delete();
            $rehabPlan->exercises()->createMany(
                collect($data['exercises'])->map(fn($e) => [
                    'day_of_week'          => $e['day_of_week'],
                    'name'                 => $e['name'],
                    'sets'                 => $e['sets'],
                    'reps'                 => $e['reps'],
                    'notes'                => $e['notes'] ?? null,
                    'alternative_exercise' => $e['alternative_exercise'] ?? null,
                ])->toArray()
            );
        }

        $rehabPlan->load('exercises');

        return response()->json($this->formatForClinic($rehabPlan));
    }

    /* DELETE /clinic/rehab-plans/{rehabPlan} */
    public function destroy(Request $request, RehabPlan $rehabPlan)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $rehabPlan->delete();

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

        return response()->json($exercise);
    }

    /* DELETE /clinic/rehab-plans/{rehabPlan}/exercises/{exercise} */
    public function destroyExercise(Request $request, RehabPlan $rehabPlan, RehabPlanExercise $exercise)
    {
        if ($rehabPlan->clinic_id !== $request->user()->clinic->id || $exercise->rehab_plan_id !== $rehabPlan->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $exercise->delete();

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
        ]);

        $rehabPlan->exercises->each(fn($ex) => $newPlan->exercises()->create([
            'day_of_week'          => $ex->day_of_week,
            'name'                 => $ex->name,
            'sets'                 => $ex->sets,
            'reps'                 => $ex->reps,
            'notes'                => $ex->notes,
            'alternative_exercise' => $ex->alternative_exercise,
        ]));

        $newPlan->load('exercises');

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
        $data                   = $plan->toArray();
        $data['exercises_by_day'] = $plan->exercisesByDay();
        return $data;
    }
}
