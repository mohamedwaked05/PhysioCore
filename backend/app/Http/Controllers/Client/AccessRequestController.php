<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreAccessRequestRequest;
use App\Models\Clinic;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AccessRequestController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $requests = Cache::remember("access_requests_{$userId}", 60, fn() =>
            $request->user()
                ->clientProfile
                ->accessRequests()
                ->with('clinic:id,user_id,legal_name,commercial_name,specialty_text,address')
                ->latest()
                ->get()
        );

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

        // Notify the clinic
        try {
            $clinic    = Clinic::find($request->clinic_id);
            $sender    = $request->user();
            $firstName = $sender->first_name ?? 'A client';
            $lastName  = $sender->last_name  ?? '';

            if ($clinic?->user_id) {
                Message::create([
                    'sender_id'    => $sender->id,
                    'receiver_id'  => $clinic->user_id,
                    'context'      => 'inquiry',
                    'reference_id' => $clinic->id,
                    'content'      => "{$firstName} {$lastName} has sent you an access request and is waiting for your approval.",
                    'is_read'      => false,
                ]);
            }
        } catch (\Throwable) {}

        Cache::forget("access_requests_{$request->user()->id}");

        return response()->json(
            $accessRequest->load('clinic:id,user_id,legal_name,commercial_name,specialty_text,address'),
            201
        );
    }
}
