<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast a safety flag alert to the private-admin channel.
 * Admins subscribe to this channel to get live safety alerts
 * regardless of which notification record they own.
 */
class SafetyFlagBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly array $payload) {}

    public function broadcastAs(): string
    {
        return 'SafetyFlagBroadcast';
    }

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('admin')];

        if (!empty($this->payload['clinic_id'])) {
            $channels[] = new PrivateChannel('clinic.' . $this->payload['clinic_id']);
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
