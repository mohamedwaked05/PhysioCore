<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    /**
     * GET /api/auth/google
     *
     * Redirects the browser to Google's OAuth consent screen.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * GET /api/auth/google/callback
     *
     * Handles the OAuth callback from Google.
     * - Existing user → issue token, redirect to frontend
     * - New user → store data in cache, redirect to role selection
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect(config('app.frontend_url') . '/login?error=google_auth_failed');
        }

        $result = $this->authService->handleExistingGoogleUser($googleUser);

        if ($result) {
            // Existing user — log them in
            $token = $result['token'];
            $role  = $result['user']->role;
            return redirect(
                config('app.frontend_url') . '/auth/google/callback?token=' . $token . '&role=' . $role
            );
        }

        // New user — redirect to role selection with a temporary setup token
        $setupToken = $this->authService->initiateGoogleRegistration($googleUser);
        return redirect(
            config('app.frontend_url') . '/auth/google/complete?setup_token=' . $setupToken
        );
    }

    /**
     * POST /api/auth/google/complete
     *
     * Completes Google registration: creates the account with the chosen role
     * and sends a verification email.
     */
    public function completeGoogleRegistration(Request $request): JsonResponse
    {
        $request->validate([
            'setup_token' => 'required|string',
            'role'        => 'required|in:client,clinic',
            'password'    => 'nullable|string|min:8|confirmed',
        ]);

        try {
            $this->authService->completeGoogleRegistration(
                $request->setup_token,
                $request->role,
                $request->password
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Account created. Please check your email to verify your account.',
        ]);
    }
}
