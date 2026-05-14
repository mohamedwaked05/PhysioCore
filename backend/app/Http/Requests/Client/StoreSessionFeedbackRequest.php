<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;

class StoreSessionFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clinic_id'            => ['required', 'integer', 'exists:clinics,id'],
            'rating'               => ['nullable', 'integer', 'min:1', 'max:5'],
            'pain_level'           => ['nullable', 'integer', 'min:1', 'max:10'],
            'effort_level'         => ['nullable', 'integer', 'min:1', 'max:10'],
            'feedback_text'        => ['nullable', 'string', 'max:600'],
            'exercises_completed'  => ['required', 'integer', 'min:0'],
            'exercises_total'      => ['required', 'integer', 'min:0'],
            'exercise_ids'         => ['nullable', 'array'],
            'exercise_ids.*'       => ['integer', 'min:1'],
        ];
    }
}
