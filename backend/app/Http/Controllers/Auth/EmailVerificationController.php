<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * GET /api/auth/verify-email/{id}/{hash}
     *
     * Called when the user clicks the verification link in their email.
     * Validates the signed URL, marks the email as verified,
     * then redirects to the frontend.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Ensure the hash matches the user's email
        if (! hash_equals(sha1($user->email), $hash)) {
            return redirect(config('app.frontend_url') . '/email-verified?status=invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect(config('app.frontend_url') . '/email-verified?status=already-verified');
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return redirect(config('app.frontend_url') . '/email-verified?status=success');
    }

    /**
     * POST /api/auth/resend-verification
     *
     * Resends the verification email for the authenticated user.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.'], 200);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email resent.'], 200);
    }
}
