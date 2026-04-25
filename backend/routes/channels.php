<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
 * user.{id}  — personal channel; only the matching user can subscribe
 * admin      — admin-only broadcast channel; any non-admin is rejected
 */

Broadcast::channel('user.{id}', function ($user, $id) {
    $allowed = (int) $user->id === (int) $id;

    if (!$allowed) {
        Log::warning("WS auth rejected: user {$user->id} tried to subscribe to user.{$id}");
    }

    return $allowed;
});

Broadcast::channel('rehab-plan.{clientProfileId}', function ($user, $clientProfileId) {
    $profile = \App\Models\ClientProfile::where('user_id', $user->id)->first();
    return $profile && (int) $profile->id === (int) $clientProfileId;
});

Broadcast::channel('clinic.{clinicId}', function ($user, $clinicId) {
    return $user->role === 'clinic' && (int) $user->clinic?->id === (int) $clinicId;
});

Broadcast::channel('admin', function ($user) {
    $allowed = $user->role === 'admin';

    if (!$allowed) {
        Log::warning("WS auth rejected: user {$user->id} (role={$user->role}) tried to subscribe to admin channel");
    }

    return $allowed;
});
