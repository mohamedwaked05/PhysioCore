<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'first_name' => ['required', 'string', 'max:50'],
            'last_name'  => ['required', 'string', 'max:50'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'role'       => ['required', 'in:client,clinic'],
        ];

        // Extra fields required when registering as a clinic
        if ($this->input('role') === 'clinic') {
            $rules['clinic_mobile']   = ['required', 'string', 'max:30'];
            $rules['payment_methods'] = ['required', 'string', 'max:255'];
            $rules['license_file']    = ['required', 'file', 'mime_types:application/pdf,image/jpeg,image/png', 'max:5120'];
            $rules['cert_file']       = ['required', 'file', 'mime_types:application/pdf,image/jpeg,image/png', 'max:5120'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'clinic_mobile.required'   => 'Clinic phone number is required.',
            'payment_methods.required' => 'Please select at least one payment method.',
            'license_file.required'    => 'License document is required.',
            'cert_file.required'       => 'Certification document is required.',
        ];
    }
}
