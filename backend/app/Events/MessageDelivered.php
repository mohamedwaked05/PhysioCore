<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDelivered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $senderId,
        public readonly array $messageIds,
        public readonly string $deliveredAt,
    ) {}

    public function broadcastAs(): string
    {
        return 'MessageDelivered';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->senderId)];
    }

    public function broadcastWith(): array
    {
        return [
            'message_ids'  => $this->messageIds,
            'delivered_at' => $this->deliveredAt,
        ];
    }
}
