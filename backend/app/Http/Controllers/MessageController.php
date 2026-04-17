<?php

namespace App\Http\Controllers;

use App\Http\Requests\Message\SendMessageRequest;
use App\Models\AccessRequest;
use App\Models\ClientProfile;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $messages = Message::where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            })
            ->when($request->filled('context'), fn($q) => $q->where('context', $request->context))
            ->when($request->filled('reference_id'), fn($q) => $q->where('reference_id', $request->reference_id))
            ->when($request->filled('with_user_id'), fn($q) => $q->where(function ($inner) use ($request) {
                $inner->where('sender_id', $request->with_user_id)
                      ->orWhere('receiver_id', $request->with_user_id);
            }))
            ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->oldest()
            ->get();

        // Mark fetched messages as read
        Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->when($request->filled('context'), fn($q) => $q->where('context', $request->context))
            ->when($request->filled('reference_id'), fn($q) => $q->where('reference_id', $request->reference_id))
            ->when($request->filled('with_user_id'), fn($q) => $q->where('sender_id', $request->with_user_id))
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    public function store(SendMessageRequest $request)
    {
        // Gate: treatment chat requires an approved access request
        if (in_array($request->context, ['treatment', 'feedback'])) {
            $clinicId = $request->reference_id;

            $sender   = $request->user();
            $receiver = User::find($request->receiver_id);

            $clientUser = $sender->role === 'client' ? $sender : $receiver;

            $clientProfile = $clientUser
                ? ClientProfile::where('user_id', $clientUser->id)->first()
                : null;

            $approved = $clientProfile && AccessRequest::where('client_profile_id', $clientProfile->id)
                ->where('clinic_id', $clinicId)
                ->where('status', 'approved')
                ->exists();

            if (!$approved) {
                return response()->json([
                    'message' => 'Chat is only available after the clinic approves your access request.',
                ], 403);
            }
        }

        $message = Message::create([
            ...$request->validated(),
            'sender_id' => $request->user()->id,
        ]);

        return response()->json(
            $message->load(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name']),
            201
        );
    }

    public function notifications(Request $request)
    {
        $has_new_messages = Message::where('receiver_id', $request->user()->id)
            ->where('is_read', false)
            ->exists();

        return response()->json(['has_new_messages' => $has_new_messages]);
    }
}
