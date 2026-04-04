<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreAccessRequestRequest;
use Illuminate\Http\Request;

class AccessRequestController extends Controller
{
    public function index(Request $request)
    {
        $requests = $request->user()
            ->clientProfile
            ->accessRequests()
            ->with('clinic:id,name,specialty,address')
            ->latest()
            ->get();

        return response()->json($requests);
    }

    public function store(StoreAccessRequestRequest $request)
    {
        $profile = $request->user()->clientProfile;

        $exists = $profile->accessRequests()
            ->where('clinic_id', $request->clinic_id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'You already have an active request for this clinic.',
            ], 422);
        }

        $accessRequest = $profile->accessRequests()->create($request->validated());

        return response()->json(
            $accessRequest->load('clinic:id,name,specialty,address'),
            201
        );
    }
}
