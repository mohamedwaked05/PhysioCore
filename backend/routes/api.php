<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Client\AccessRequestController;
use App\Http\Controllers\Client\ClientProfileController;
use App\Http\Controllers\Client\ClinicController;
use App\Http\Controllers\Clinic\ClinicProfileController;
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

    // Authenticated user info (used for token verification / debugging)
    Route::get('/user', fn () => response()->json(auth()->user()));
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
});

/*
|--------------------------------------------------------------------------
| Client Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:client'])->prefix('client')->group(function () {
    // Profile
    Route::get('/profile',          [ClientProfileController::class, 'show']);
    Route::post('/profile/update',  [ClientProfileController::class, 'update']);

    // Clinic listing
    Route::get('/clinics', [ClinicController::class, 'index']);

    // Access requests
    Route::get('/access-requests',  [AccessRequestController::class, 'index']);
    Route::post('/access-request',  [AccessRequestController::class, 'store']);
});
