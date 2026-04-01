<?php

namespace App\Services;

use App\Models\ClientProfile;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
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

        // Wrong email or wrong password
        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Find or create a user from a Google OAuth response,
     * auto-verify their email, and return a Sanctum token.
     */
    public function handleGoogleUser(SocialiteUser $googleUser): array
    {
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            // Existing user: attach google_id if missing (e.g. registered via email first)
            if (! $user->google_id) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'provider'  => 'google',
                ]);
            }
        } else {
            // New user: create account, Google users skip email verification
            $nameParts = explode(' ', $googleUser->getName(), 2);

            $user = User::create([
                'first_name'        => $nameParts[0],
                'last_name'         => $nameParts[1] ?? '',
                'email'             => $googleUser->getEmail(),
                'password_hash'     => null,
                'role'              => 'client',
                'status'            => 'active',
                'provider'          => 'google',
                'google_id'         => $googleUser->getId(),
                'email_verified_at' => now(),
            ]);

            $this->initializeProfile($user);
        }

        // Ensure email is verified for Google users
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }
}
