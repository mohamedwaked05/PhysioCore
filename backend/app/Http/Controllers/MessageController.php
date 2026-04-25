<?php

namespace App\Http\Controllers;

use App\Events\MessageDelivered;
use App\Events\MessageSeen;
use App\Http\Requests\Message\SendMessageRequest;
use App\Models\AccessRequest;
use App\Models\ClientProfile;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

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

        $message->load(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name']);

        $sender = $message->sender;
        $this->notifications->notify($request->receiver_id, 'message', [
            'sender_name'  => $sender ? trim($sender->first_name . ' ' . $sender->last_name) : 'System',
            'content'      => mb_strimwidth($message->content, 0, 120, '…'),
            'context'      => $message->context,
            'message_id'   => $message->id,
            'reference_id' => $message->reference_id,
            // Full message object lets the receiver append it directly in the UI
            // without a follow-up GET /messages refetch (already loaded above).
            'message'      => $message->toArray(),
        ]);

        return response()->json($message, 201);
    }

    public function notifications(Request $request)
    {
        $userId = $request->user()->id;

        $unread = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->with('sender:id,first_name,last_name')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'has_new_messages' => $unread->isNotEmpty(),
            'count'            => $unread->count(),
            'items'            => $unread->map(fn($m) => [
                'id'           => $m->id,
                'context'      => $m->context,
                'content'      => $m->content,
                'reference_id' => $m->reference_id,
                'sender'       => $m->sender
                    ? trim($m->sender->first_name . ' ' . $m->sender->last_name)
                    : 'System',
                'created_at'   => $m->created_at,
            ]),
        ]);
    }

    public function markAllRead(Request $request)
    {
        Message::where('receiver_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    public function markOneRead(Request $request, int $id)
    {
        Message::where('id', $id)
            ->where('receiver_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    public function markDelivered(Request $request)
    {
        $userId = $request->user()->id;
        $ids    = $request->input('message_ids', []);

        if (empty($ids)) return response()->json(['ok' => true]);

        // Only receiver can mark delivered; skip already-delivered messages
        $messages = Message::whereIn('id', $ids)
            ->where('receiver_id', $userId)
            ->whereNull('delivered_at')
            ->get();

        $now = now();

        // Single batch UPDATE instead of one query per message
        Message::whereIn('id', $messages->pluck('id'))->update(['delivered_at' => $now]);

        // One broadcast per unique sender (grouping reduces WS events from N → ≤N/senders)
        foreach ($messages->groupBy('sender_id') as $senderId => $group) {
            broadcast(new MessageDelivered(
                (int) $senderId,
                $group->pluck('id')->toArray(),
                $now->toISOString(),
            ));
        }

        return response()->json(['ok' => true]);
    }

    public function markSeen(Request $request)
    {
        $userId = $request->user()->id;

        $query = Message::where('receiver_id', $userId)->whereNull('seen_at');

        if ($request->filled('sender_id'))    $query->where('sender_id',    $request->sender_id);
        if ($request->filled('context'))      $query->where('context',      $request->context);
        if ($request->filled('reference_id')) $query->where('reference_id', $request->reference_id);

        $messages = $query->get();
        if ($messages->isEmpty()) return response()->json(['ok' => true]);

        $now = now();
        Message::whereIn('id', $messages->pluck('id'))->update([
            'delivered_at' => $now, // ensure delivered is also set if missed
            'seen_at'      => $now,
        ]);

        // One broadcast per unique sender
        foreach ($messages->groupBy('sender_id') as $senderId => $group) {
            broadcast(new MessageSeen(
                $senderId,
                $group->pluck('id')->toArray(),
                $now->toISOString(),
            ));
        }

        return response()->json(['ok' => true]);
    }
}
