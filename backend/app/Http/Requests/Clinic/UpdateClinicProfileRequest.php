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
            'legal_name'        => ['sometimes', 'string', 'max:255'],
            'commercial_name'   => ['sometimes', 'string', 'max:255'],
            'clinic_email'      => ['sometimes', 'email', 'max:255'],
            'clinic_mobile'     => ['sometimes', 'string', 'max:20'],
            'address'           => ['sometimes', 'string', 'max:500'],
            'description'       => ['nullable', 'string', 'max:2000'],
            'specialty_text'    => ['sometimes', 'required', 'string', 'max:255'],
            'tax_id'            => ['sometimes', 'required', 'string', 'max:100'],
            'license_number'    => ['sometimes', 'required', 'string', 'max:100'],
            'license_file'      => ['nullable', 'file', 'mime_types:application/pdf,image/jpeg,image/png', 'max:5120'],
            'cert_file'         => ['nullable', 'file', 'mime_types:application/pdf,image/jpeg,image/png', 'max:5120'],
            'profile_photo'     => ['nullable', 'image', 'mime_types:image/jpeg,image/png', 'max:5120'],
            'cover_photo'       => ['nullable', 'image', 'mime_types:image/jpeg,image/png', 'max:8192'],
            'certifications'    => ['nullable', 'string', 'max:2000'],
            'experience'        => ['nullable', 'string', 'max:255'],
            'payment_methods'          => ['sometimes', 'required', 'string', 'max:255'],
            'services'                 => ['nullable', 'string', 'max:2000'],
            'working_hours'            => ['sometimes', 'required', 'string', 'max:255'],
            'social_media_link'        => ['nullable', 'url', 'max:255'],
            'min_price'                => ['sometimes', 'required', 'integer', 'min:0', 'max:99999'],
            'max_price'                => ['sometimes', 'required', 'integer', 'min:0', 'max:99999', 'gte:min_price'],
            'estimated_response_time'  => ['sometimes', 'required', 'string', 'max:100'],
        ];
    }
}
