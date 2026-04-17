<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Client\AccessRequestController;
use App\Http\Controllers\Client\ClientProfileController;
use App\Http\Controllers\Client\ClinicController;
use App\Http\Controllers\Clinic\ClinicProfileController;
use App\Http\Controllers\Clinic\AccessRequestController as ClinicAccessRequestController;
use App\Http\Controllers\Clinic\PatientFeedbackController;
use App\Http\Controllers\Client\SessionFeedbackController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Sprint 1 — Authentication Routes
|--------------------------------------------------------------------------
*/

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    // Email verification (signed URL + throttle)
    Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    // Password reset
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/reset-password',  [PasswordResetController::class, 'resetPassword']);

    // Google OAuth
    Route::get('/google',                   [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback',          [SocialAuthController::class, 'handleGoogleCallback']);
    Route::post('/google/complete',         [SocialAuthController::class, 'completeGoogleRegistration']);
});

// Protected routes (require Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/resend-verification', [EmailVerificationController::class, 'resend']);

    // Authenticated user info
    Route::get('/user', function () {
        $user = auth()->user();
        return response()->json([
            'id'         => $user->id,
            'first_name' => $user->first_name,
            'last_name'  => $user->last_name,
            'email'      => $user->email,
            'role'       => $user->role,
            'status'     => $user->status,
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Clinic Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:clinic'])->prefix('clinic')->group(function () {
    Route::get('/profile',          [ClinicProfileController::class, 'show']);
    Route::post('/profile',         [ClinicProfileController::class, 'store']);
    Route::post('/profile/update',  [ClinicProfileController::class, 'update']);

    // Access requests from clients
    Route::get('/access-requests',                      [ClinicAccessRequestController::class, 'index']);
    Route::patch('/access-requests/{accessRequest}',    [ClinicAccessRequestController::class, 'update']);

    // Patient session feedback (clinic reads)
    Route::get('/patients/{clientProfileId}/feedback',  [PatientFeedbackController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Public Routes (no auth required — read-only, approved clinics only)
|--------------------------------------------------------------------------
*/

Route::get('/clinics',      [ClinicController::class, 'index']);
Route::get('/clinics/{id}', [ClinicController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Client Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:client'])->prefix('client')->group(function () {
    // Profile
    Route::get('/profile',          [ClientProfileController::class, 'show']);
    Route::post('/profile/update',  [ClientProfileController::class, 'update']);

    // Clinic listing & detail
    Route::get('/clinics',      [ClinicController::class, 'index']);
    Route::get('/clinics/{id}', [ClinicController::class, 'show']);

    // Access requests
    Route::get('/access-requests',  [AccessRequestController::class, 'index']);
    Route::post('/access-request',  [AccessRequestController::class, 'store']);

    // Session feedback (client submits)
    Route::post('/session-feedback', [SessionFeedbackController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Messages (clients + clinics)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('messages')->group(function () {
    Route::get('/',               [MessageController::class, 'index']);
    Route::post('/',              [MessageController::class, 'store']);
    Route::get('/notifications',  [MessageController::class, 'notifications']);
});
