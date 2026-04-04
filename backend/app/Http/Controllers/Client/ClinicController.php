<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Clinic;

class ClinicController extends Controller
{
    public function index()
    {
        $clinics = Clinic::where('status', 'verified')
            ->select(['id', 'name', 'description', 'specialty', 'address', 'phone'])
            ->get();

        return response()->json($clinics);
    }
}
