<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /notifications
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Only return unseen notifications — once seen they leave the dropdown permanently
        $items = UserNotification::where('user_id', $userId)
            ->whereIn('status', ['unread', 'delivered'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'data'       => $n->data,
                'status'     => $n->status,
                'created_at' => $n->created_at,
            ]);

        $unreadCount = $items->count();

        return response()->json([
            'unread_count' => $unreadCount,
            'items'        => $items,
        ]);
    }

    // PATCH /notifications/{id}/seen
    public function markSeen(Request $request, int $id)
    {
        UserNotification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->update(['status' => 'seen']);

        return response()->json(['ok' => true]);
    }

    // POST /notifications/seen-all
    // Called when the dropdown opens — marks all unread/delivered as seen
    public function markAllSeen(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereIn('status', ['unread', 'delivered'])
            ->update(['status' => 'seen']);

        return response()->json(['ok' => true]);
    }
}
