<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Clinic;

class ClinicController extends Controller
{
    public function show($id)
    {
        $clinic = Clinic::where('verification_status', 'approved')
            ->select([
                'id', 'user_id', 'legal_name', 'commercial_name', 'description',
                'specialty_text', 'address', 'clinic_mobile',
                'profile_photo_url', 'services', 'working_hours',
                'payment_methods', 'min_price', 'max_price',
                'estimated_response_time',
            ])
            ->findOrFail($id);

        return response()->json($clinic);
    }

    public function index()
    {
        $clinics = Clinic::where('verification_status', 'approved')
            ->select([
                'id', 'legal_name', 'commercial_name', 'description',
                'specialty_text', 'address', 'clinic_mobile',
                'profile_photo_url', 'services', 'working_hours',
                'payment_methods', 'min_price', 'max_price',
                'estimated_response_time',
            ])
            ->get();

        return response()->json($clinics);
    }
}
