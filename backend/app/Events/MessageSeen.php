<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSeen implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int    $senderId,
        public array  $messageIds,
        public string $seenAt,
    ) {}

    public function broadcastAs(): string
    {
        return 'MessageSeen';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->senderId)];
    }

    public function broadcastWith(): array
    {
        return [
            'message_ids' => $this->messageIds,
            'seen_at'     => $this->seenAt,
        ];
    }
}
