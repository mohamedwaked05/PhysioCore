<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

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

    public function qrCode($id)
    {
        $clinic = Clinic::where('verification_status', 'approved')
            ->select(['id'])
            ->findOrFail($id);

        $url = 'https://physiocore.health/clinics/' . $clinic->id;

        $svg = QrCode::format('svg')->size(300)->margin(1)->generate($url);

        return response($svg, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('Cache-Control', 'public, max-age=86400')
            ->header('Access-Control-Allow-Origin', '*');
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
