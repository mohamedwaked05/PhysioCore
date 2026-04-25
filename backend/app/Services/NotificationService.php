<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Events\SafetyFlagBroadcast;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create → broadcast → mark delivered for a single user.
     */
    public function notify(int $userId, string $type, array $data): void
    {
        try {
            $notification = UserNotification::create([
                'user_id' => $userId,
                'type'    => $type,
                'data'    => $data,
                'status'  => 'unread',
            ]);

            broadcast(new NotificationCreated($notification));

            // Mark delivered once the broadcast has been queued
            $notification->update(['status' => 'delivered']);
        } catch (\Throwable $e) {
            Log::warning("NotificationService::notify failed [{$type}] user {$userId}: " . $e->getMessage());
        }
    }

    /**
     * Create → broadcast → mark delivered for every admin + fire the admin-channel event.
     */
    public function notifyAdmins(string $type, array $data): void
    {
        try {
            $adminIds = User::where('role', 'admin')->pluck('id');

            $notificationIds = [];
            foreach ($adminIds as $adminId) {
                $notification = UserNotification::create([
                    'user_id' => $adminId,
                    'type'    => $type,
                    'data'    => $data,
                    'status'  => 'unread',
                ]);

                broadcast(new NotificationCreated($notification));
                $notificationIds[] = $notification->id;
            }

            // Single batch update instead of one UPDATE per admin
            if (!empty($notificationIds)) {
                UserNotification::whereIn('id', $notificationIds)->update(['status' => 'delivered']);
            }

            // Single broadcast on the shared admin channel so all active admin
            // sessions receive the alert even before their next poll
            broadcast(new SafetyFlagBroadcast($data));
        } catch (\Throwable $e) {
            Log::warning("NotificationService::notifyAdmins failed [{$type}]: " . $e->getMessage());
        }
    }
}
