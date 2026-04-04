<?php

namespace App\Http\Requests\Clinic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'legal_name'      => ['sometimes', 'string', 'max:255'],
            'commercial_name' => ['sometimes', 'string', 'max:255'],
            'clinic_email'    => ['sometimes', 'email', 'max:255'],
            'clinic_mobile'   => ['sometimes', 'string', 'max:20'],
            'address'         => ['sometimes', 'string', 'max:500'],
            'description'     => ['nullable', 'string', 'max:2000'],
            'specialty_text'  => ['nullable', 'string', 'max:255'],
            'tax_id'          => ['nullable', 'string', 'max:100'],
            'license_number'  => ['nullable', 'string', 'max:100'],
            'license_file'    => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
