<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_of_birth'       => ['nullable', 'date', 'before:today'],
            'gender'              => ['nullable', 'in:male,female,other'],
            'phone'               => ['nullable', 'string', 'max:20'],
            'address'             => ['nullable', 'string', 'max:255'],
            'condition_summary'   => ['nullable', 'string', 'max:500'],
            'injury_details'      => ['nullable', 'string', 'max:2000'],
            'medical_history'     => ['nullable', 'string', 'max:2000'],
            'allergies'           => ['nullable', 'string', 'max:500'],
            'current_medications' => ['nullable', 'string', 'max:500'],
            'emergency_contact'   => ['nullable', 'string', 'max:255'],
        ];
    }
}
