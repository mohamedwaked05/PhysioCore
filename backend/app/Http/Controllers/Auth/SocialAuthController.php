<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
     * Completes Google registration: creates the account with the chosen role.
     * For clinics, also accepts the same verification fields as email registration
     * (phone, payment methods, license file, cert file) so they don't need a
     * separate profile-completion step after sign-up.
     *
     * All roles: verification email sent immediately; frontend shows "check inbox" screen.
     */
    public function completeGoogleRegistration(Request $request): JsonResponse
    {
        $request->validate([
            'setup_token'     => 'required|string',
            'role'            => 'required|in:client,clinic',
            'password'        => 'nullable|string|min:8|confirmed',
            // Clinic-only fields
            'clinic_mobile'   => 'required_if:role,clinic|nullable|string|max:30',
            'payment_methods' => 'required_if:role,clinic|nullable|string',
            'license_file'    => 'required_if:role,clinic|nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'cert_file'       => 'required_if:role,clinic|nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $clinicData = [];
        if ($request->role === 'clinic') {
            $clinicData['clinic_mobile']   = $request->clinic_mobile;
            $clinicData['payment_methods'] = $request->payment_methods;

            if ($request->hasFile('license_file')) {
                $clinicData['license_file_url'] = $this->storeFile($request, 'license_file', 'licenses');
            }
            if ($request->hasFile('cert_file')) {
                $clinicData['cert_file_url'] = $this->storeFile($request, 'cert_file', 'certifications');
            }
        }

        try {
            $this->authService->completeGoogleRegistration(
                $request->setup_token,
                $request->role,
                $request->password,
                $clinicData
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Account created. Please check your email to verify your account.',
        ]);
    }

    private function storeFile(Request $request, string $field, string $folder): string
    {
        $file     = $request->file($field);
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs($folder, $filename, 'public');

        return Storage::disk('public')->url($path);
    }
}
