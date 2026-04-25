<?php

namespace App\Http\Requests\RehabPlan;

use Illuminate\Foundation\Http\FormRequest;

class StoreRehabPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_profile_id'                => ['required', 'integer', 'exists:client_profiles,id'],
            'injury_type'                      => ['required', 'string', 'max:100'],
            'week_number'                      => ['sometimes', 'integer', 'min:1', 'max:52'],
            'start_date'                       => ['nullable', 'date'],
            'end_date'                         => ['nullable', 'date', 'after_or_equal:start_date'],
            'exercises'                        => ['required', 'array', 'min:1'],
            'exercises.*.day_of_week'          => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'exercises.*.name'                 => ['required', 'string', 'max:200'],
            'exercises.*.sets'                 => ['required', 'integer', 'min:1', 'max:20'],
            'exercises.*.reps'                 => ['required', 'integer', 'min:1', 'max:999'],
            'exercises.*.notes'                => ['nullable', 'string', 'max:500'],
            'exercises.*.alternative_exercise' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'exercises.required'                   => 'At least one exercise is required.',
            'exercises.min'                        => 'At least one exercise is required.',
            'exercises.*.day_of_week.required'     => 'Each exercise must specify a day of the week.',
            'exercises.*.day_of_week.in'           => 'Invalid day of week.',
            'exercises.*.name.required'            => 'Each exercise must have a name.',
            'exercises.*.sets.required'            => 'Each exercise must have sets.',
            'exercises.*.sets.min'                 => 'Sets must be at least 1.',
            'exercises.*.reps.required'            => 'Each exercise must have reps.',
            'exercises.*.reps.min'                 => 'Reps must be at least 1.',
        ];
    }
}
