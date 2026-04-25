<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RehabPlanUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $clientProfileId,
        public readonly array $plan
    ) {}

    public function broadcastAs(): string
    {
        return 'RehabPlanUpdated';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("rehab-plan.{$this->clientProfileId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return ['plan' => $this->plan];
    }
}
