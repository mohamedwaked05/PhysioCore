<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    /**
     * GET /api/auth/google
     *
     * Redirects the browser to Google's OAuth consent screen.
     * The frontend should navigate to this URL directly (not fetch it).
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * GET /api/auth/google/callback
     *
     * Handles the OAuth callback from Google.
     * Finds or creates the user, issues a Sanctum token,
     * and redirects the browser to the frontend with the token.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect(config('app.frontend_url') . '/login?error=google_auth_failed');
        }

        $result = $this->authService->handleGoogleUser($googleUser);

        $token = $result['token'];
        $role  = $result['user']->role;

        // Pass the token to the frontend via query string.
        // The frontend reads this on mount, stores it, then removes it from the URL.
        return redirect(
            config('app.frontend_url') . '/auth/callback?token=' . $token . '&role=' . $role
        );
    }
}
