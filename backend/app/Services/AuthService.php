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
                'user_id' => $user->id,
                'name'    => $user->first_name . ' ' . $user->last_name,
                'status'  => 'pending',
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

        // Google-only account (no password set)
        if (! $user->password_hash) {
            throw ValidationException::withMessages([
                'email' => ['This account was created with Google. Please sign in with Google or set a password first.'],
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
     * Handle an existing Google user login.
     * Returns a Sanctum token if the user already has an account.
     * Returns null if the user is new (needs to complete registration).
     */
    public function handleExistingGoogleUser(SocialiteUser $googleUser): ?array
    {
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (! $user) {
            return null;
        }

        if (! $user->google_id) {
            $user->update([
                'google_id' => $googleUser->getId(),
                'provider'  => 'google',
            ]);
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
