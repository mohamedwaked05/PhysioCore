<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Clinic;

class ClinicController extends Controller
{
    public function index()
    {
        $clinics = Clinic::where('verification_status', 'approved')
            ->select([
                'id', 'legal_name', 'commercial_name', 'description',
                'specialty_text', 'address', 'clinic_mobile',
                'profile_photo_url', 'services', 'working_hours',
            ])
            ->get();

        return response()->json($clinics);
    }
}
