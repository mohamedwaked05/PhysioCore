<?php

namespace App\Events;

use App\Models\UserNotification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast a new notification to a specific user's private channel.
 */
class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly UserNotification $notification) {}

    public function broadcastAs(): string
    {
        return 'NotificationCreated';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->user_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id'         => $this->notification->id,
                'type'       => $this->notification->type,
                'data'       => $this->notification->data,
                'status'     => $this->notification->status,
                'created_at' => $this->notification->created_at,
            ],
        ];
    }
}
