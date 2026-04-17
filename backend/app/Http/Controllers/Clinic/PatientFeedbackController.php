<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\SessionFeedback;
use Illuminate\Http\Request;

class PatientFeedbackController extends Controller
{
    public function index(Request $request, $clientProfileId)
    {
        $clinic = $request->user()->clinic;

        // Ensure this patient actually belongs to the clinic
        $isPatient = $clinic->accessRequests()
            ->where('client_profile_id', $clientProfileId)
            ->where('status', 'approved')
            ->exists();

        if (!$isPatient) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        $profile = ClientProfile::with('user:id,first_name,last_name')
            ->findOrFail($clientProfileId);

        $feedbacks = SessionFeedback::where('client_profile_id', $clientProfileId)
            ->where('clinic_id', $clinic->id)
            ->latest('session_date')
            ->get();

        return response()->json([
            'patient'   => $profile,
            'feedbacks' => $feedbacks,
        ]);
    }
}
