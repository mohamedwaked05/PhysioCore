<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    /**
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Store clinic documents and attach their public URLs to the data array
        if ($data['role'] === 'clinic') {
            if ($request->hasFile('license_file')) {
                $data['license_file_url'] = $this->storeFile($request, 'license_file', 'licenses');
            }
            if ($request->hasFile('cert_file')) {
                $data['cert_file_url'] = $this->storeFile($request, 'cert_file', 'certifications');
            }
        }

        $user = $this->authService->register($data);

        return response()->json([
            'message' => 'Registration successful. Please check your email to verify your account.',
            'user'    => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'role'       => $user->role,
            ],
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        $user = $result['user'];

        return response()->json([
            'message' => 'Login successful.',
            'token'   => $result['token'],
            'user'    => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'role'       => $user->role,
                'status'     => $user->status,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     *
     * Revokes the token that was used to make this request.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    private function storeFile(Request $request, string $field, string $folder): string
    {
        $file     = $request->file($field);
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs($folder, $filename, 'public');

        return Storage::disk('public')->url($path);
    }
}
