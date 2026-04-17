<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\UpdateAccessRequestRequest;
use App\Models\AccessRequest;
use Illuminate\Http\Request;

class AccessRequestController extends Controller
{
    public function index(Request $request)
    {
        $clinic = $request->user()->clinic;

        $requests = AccessRequest::where('clinic_id', $clinic->id)
            ->with('clientProfile.user:id,first_name,last_name')
            ->latest()
            ->get();

        return response()->json($requests);
    }

    public function update(UpdateAccessRequestRequest $request, AccessRequest $accessRequest)
    {
        $clinic = $request->user()->clinic;

        if ($accessRequest->clinic_id !== $clinic->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($accessRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $newStatus = $request->action === 'approve' ? 'approved' : 'rejected';
        $accessRequest->update(['status' => $newStatus]);

        return response()->json(
            $accessRequest->load('clientProfile.user:id,first_name,last_name')
        );
    }
}
