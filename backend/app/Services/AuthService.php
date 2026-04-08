<?php

namespace App\Services;

use App\Models\ClientProfile;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class AuthService
{
    /**
     * Register a new user via email/password and dispatch
     * the Registered event (triggers email verification mail).
     */
    public function register(array $data): User
    {
        $user = User::create([
            'first_name'    => $data['first_name'],
            'last_name'     => $data['last_name'],
            'email'         => $data['email'],
            'password_hash' => $data['password'],   // cast handles hashing
            'role'          => $data['role'],
            'status'        => 'active',
            'provider'      => 'local',
        ]);

        $this->initializeProfile($user);

        // Fires the built-in Registered event → Laravel sends verification email
        event(new Registered($user));

        return $user;
    }

    /**
     * Create the appropriate profile record based on the user's role.
     * client → ClientProfile
     * clinic → Clinic (status = pending, awaiting admin verification)
     */
    private function initializeProfile(User $user): void
    {
        if ($user->role === 'client') {
            ClientProfile::create(['user_id' => $user->id]);
        } elseif ($user->role === 'clinic') {
            Clinic::create([
                'user_id'             => $user->id,
                'legal_name'          => $user->first_name . ' ' . $user->last_name,
                'verification_status' => 'pending',
            ]);
        }
    }

    /**
     * Validate credentials and return a Sanctum token.
     *
     * @throws ValidationException
     */
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Google-only account — no password has been set yet
        if (! $user->password_hash) {
            throw ValidationException::withMessages([
                'email' => ['This account uses Google Sign-In. Click "Continue with Google" to log in, or use "Forgot password?" to create a password for email login.'],
            ]);
        }

        if (! Hash::check($data['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Block unverified accounts
        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Please verify your email address before logging in.'],
            ]);
        }

        // Block suspended accounts
        if ($user->status === 'suspended') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        $remember  = $data['remember'] ?? false;
        $expiresAt = $remember ? null : now()->addDay();

        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Handle a Google OAuth login/link.
     *
     * - Finds an existing user by google_id OR email.
     * - If found by email only (email-registered account): links the google_id
     *   and auto-verifies the email (Google already confirmed ownership).
     *   The provider field is intentionally left as 'local' so we know how
     *   the account was originally created; login availability is determined
     *   by the presence of google_id (Google) and password_hash (email).
     * - Checks for suspended accounts before issuing a token.
     * - Returns null if no matching account exists (new user flow).
     */
    public function handleExistingGoogleUser(SocialiteUser $googleUser): ?array
    {
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (! $user) {
            return null;
        }

        if ($user->status === 'suspended') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        // Link Google to an existing email-registered account.
        // Do NOT overwrite provider — keep it as 'local' so the original
        // registration method is preserved. google_id alone signals Google is linked.
        if (! $user->google_id) {
            $updates = ['google_id' => $googleUser->getId()];

            // Google has verified this email — auto-verify if not already done.
            if (! $user->hasVerifiedEmail()) {
                $updates['email_verified_at'] = now();
            }

            $user->update($updates);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Store Google user data in cache and return a short-lived setup token.
     * Used when a new Google user needs to complete registration (pick a role).
     */
    public function initiateGoogleRegistration(SocialiteUser $googleUser): string
    {
        $setupToken = Str::random(40);

        Cache::put('google_setup_' . $setupToken, [
            'google_id' => $googleUser->getId(),
            'email'     => $googleUser->getEmail(),
            'name'      => $googleUser->getName(),
        ], now()->addMinutes(15));

        return $setupToken;
    }

    /**
     * Complete Google registration: retrieve cached Google data, create the user
     * with the chosen role, and fire the Registered event (sends verification email).
     */
    public function completeGoogleRegistration(string $setupToken, string $role, ?string $password = null): User
    {
        $googleData = Cache::get('google_setup_' . $setupToken);

        if (! $googleData) {
            throw new \RuntimeException('Invalid or expired setup token.');
        }

        Cache::forget('google_setup_' . $setupToken);

        $nameParts = explode(' ', $googleData['name'], 2);

        $user = User::create([
            'first_name'    => $nameParts[0],
            'last_name'     => $nameParts[1] ?? '',
            'email'         => $googleData['email'],
            'password_hash' => $password,
            'role'          => $role,
            'status'        => 'active',
            'provider'      => 'google',
            'google_id'     => $googleData['google_id'],
        ]);

        $this->initializeProfile($user);

        // Send verification email just like email/password registration
        event(new Registered($user));

        return $user;
    }
}
