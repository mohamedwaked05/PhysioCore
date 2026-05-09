<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\UpdateAccessRequestRequest;
use App\Models\AccessRequest;
use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AccessRequestController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        $clinic = $request->user()->clinic;

        $requests = Cache::remember("clinic_access_requests_{$clinic->id}", 60, fn() =>
            AccessRequest::where('clinic_id', $clinic->id)
                ->with('clientProfile.user:id,first_name,last_name')
                ->latest()
                ->get()
        );

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

        if ($clientUserId = $accessRequest->clientProfile?->user_id) {
            Cache::forget("access_requests_{$clientUserId}");
        }

        Cache::forget("clinic_access_requests_{$clinic->id}");
        Cache::forget("clinic_counts_{$clinic->id}");

        // Notify the client via message + bell notification
        try {
            $clinic      = $request->user()->clinic;
            $clientUser  = $accessRequest->clientProfile?->user;
            $clinicName  = $clinic->commercial_name ?? $clinic->legal_name ?? 'The clinic';
            $body        = $newStatus === 'approved'
                ? "{$clinicName} has approved your access request. You can now start your sessions."
                : "{$clinicName} has reviewed your request and it was not approved at this time.";

            if ($clientUser) {
                Message::create([
                    'sender_id'    => $request->user()->id,
                    'receiver_id'  => $clientUser->id,
                    'context'      => 'inquiry',
                    'reference_id' => $clinic->id,
                    'content'      => $body,
                    'is_read'      => false,
                ]);

                $notifType = $newStatus === 'approved'
                    ? 'access_request_approved'
                    : 'access_request_rejected';

                $this->notifications->notify($clientUser->id, $notifType, [
                    'clinic_name' => $clinicName,
                    'clinic_id'   => $clinic->id,
                ]);
            }
        } catch (\Throwable) {}

        return response()->json(
            $accessRequest->load('clientProfile.user:id,first_name,last_name')
        );
    }
}
