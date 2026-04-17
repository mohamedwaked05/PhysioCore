<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreSessionFeedbackRequest;
use App\Models\SessionFeedback;
use Illuminate\Http\Request;

class SessionFeedbackController extends Controller
{
    public function store(StoreSessionFeedbackRequest $request)
    {
        $profile = $request->user()->clientProfile;

        $approved = $profile->accessRequests()
            ->where('clinic_id', $request->clinic_id)
            ->where('status', 'approved')
            ->exists();

        if (!$approved) {
            return response()->json(['message' => 'You are not a patient of this clinic.'], 403);
        }

        $feedback = SessionFeedback::create([
            ...$request->validated(),
            'client_profile_id' => $profile->id,
            'session_date'      => now()->toDateString(),
        ]);

        return response()->json($feedback, 201);
    }
}
