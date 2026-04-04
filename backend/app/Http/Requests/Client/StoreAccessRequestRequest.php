<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccessRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clinic_id'          => ['required', 'integer', 'exists:clinics,id'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'payment_preference' => ['nullable', 'string', 'max:100'],
        ];
    }
}
