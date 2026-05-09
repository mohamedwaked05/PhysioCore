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
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values();

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
            'content'   => $request->input('content') ?? '',
        ]);

        $message->load(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name']);

        $sender = $message->sender;

        $this->notifications->notify($request->receiver_id, 'message', [
            'sender_name'  => $sender ? trim($sender->first_name . ' ' . $sender->last_name) : 'System',
            'content'      => mb_strimwidth($message->content, 0, 120, '…'),
            'context'      => $message->context,
            'message_id'   => $message->id,
            'reference_id' => $message->reference_id,
            'has_image'    => (bool) $message->image_url,
            // Full message object — receiver appends it directly without a refetch.
            // image_url is intentionally kept here so the bubble renders immediately.
            'message'      => $message->toArray(),
        ]);

        return response()->json($message, 201);
    }

    /**
     * POST /api/messages/upload-image
     * Accepts a multipart image, compresses it via GD, returns a base64 data URI.
     * Stored as base64 in the DB so it survives Railway redeploys.
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:10240'],
        ]);

        $file     = $request->file('image');
        $rawBytes = file_get_contents($file->getRealPath());
        $mime     = $file->getMimeType() ?? 'image/jpeg';
        $ext      = strtolower($file->getClientOriginalExtension());

        // GIF or WebP: skip GD resize to avoid animation/format loss
        if ($ext === 'gif' || $ext === 'webp') {
            return response()->json(['url' => "data:{$mime};base64," . base64_encode($rawBytes)]);
        }

        // Attempt GD resize for JPEG/PNG to keep payloads small
        try {
            $src = @imagecreatefromstring($rawBytes);
            if (!$src) {
                // GD failed — fall back to raw base64
                return response()->json(['url' => "data:{$mime};base64," . base64_encode($rawBytes)]);
            }

            $maxDim = 1200;
            $w = imagesx($src);
            $h = imagesy($src);

            if ($w > $maxDim || $h > $maxDim) {
                $ratio = $w > $h ? $maxDim / $w : $maxDim / $h;
                $newW  = (int) round($w * $ratio);
                $newH  = (int) round($h * $ratio);
                $dst   = imagecreatetruecolor($newW, $newH);
                // Preserve transparency for PNG
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);
                imagedestroy($src);
                $src = $dst;
            }

            ob_start();
            imagejpeg($src, null, 82);
            $jpeg = ob_get_clean();
            imagedestroy($src);

            return response()->json(['url' => 'data:image/jpeg;base64,' . base64_encode($jpeg)]);
        } catch (\Throwable $e) {
            // Any GD failure → return raw base64 so upload never hard-fails
            return response()->json(['url' => "data:{$mime};base64," . base64_encode($rawBytes)]);
        }
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
        $request->validate([
            'message_ids'   => ['required', 'array', 'max:100'],
            'message_ids.*' => ['integer'],
        ]);

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
