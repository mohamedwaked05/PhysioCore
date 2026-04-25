<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /* GET /clinic/dashboard/counts */
    public function counts(Request $request)
    {
        $clinic = $request->user()->clinic;
        $userId = $request->user()->id;

        $result = Cache::remember("clinic_counts_{$clinic->id}", 30, function () use ($clinic, $userId) {
            $requests_count = AccessRequest::where('clinic_id', $clinic->id)
                ->where('status', 'pending')
                ->count();

            $patients_count = AccessRequest::where('clinic_id', $clinic->id)
                ->where('status', 'approved')
                ->count();

            // Distinct clients who have sent an inquiry to this clinic
            $inquiries_count = Message::where('receiver_id', $userId)
                ->where('context', 'inquiry')
                ->distinct('sender_id')
                ->count('sender_id');

            return [
                'requests_count'     => $requests_count,
                'patients_count'     => $patients_count,
                'inquiries_count'    => $inquiries_count,
                'safety_flags_count' => 0,
            ];
        });

        return response()->json($result);
    }
}
