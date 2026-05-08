<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\StoreClinicProfileRequest;
use App\Http\Requests\Clinic\UpdateClinicProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ClinicProfileController extends Controller
{
    public function show(Request $request)
    {
        $user   = $request->user();
        $userId = $user->id;
        $clinic = Cache::remember("clinic_profile_{$userId}", 60, fn() => $user->clinic);
        $data   = $clinic ? $clinic->toArray() : [];
        $data['cover_photo_url'] = $user->cover_photo_url;
        return response()->json($data);
    }

    public function store(StoreClinicProfileRequest $request)
    {
        $clinic = $request->user()->clinic;

        if ($clinic->clinic_email) {
            return response()->json([
                'message' => 'Clinic profile already registered. Use update instead.',
            ], 422);
        }

        $data = $request->validated();
        $data['verification_status'] = 'pending';

        if ($request->hasFile('license_file')) {
            $data['license_file_url'] = $this->storeFile($request, 'license_file', 'licenses');
        }

        if ($request->hasFile('cert_file')) {
            $data['cert_file_url'] = $this->storeFile($request, 'cert_file', 'certifications');
        }

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_url'] = $this->storeFile($request, 'profile_photo', 'clinic-photos');
        }

        unset($data['license_file'], $data['cert_file'], $data['profile_photo']);
        $clinic->update($data);

        Cache::forget("clinic_profile_{$request->user()->id}");

        return response()->json($clinic->fresh(), 201);
    }

    public function update(UpdateClinicProfileRequest $request)
    {
        $user   = $request->user();
        $clinic = $user->clinic;
        $data   = $request->validated();

        if ($request->hasFile('license_file')) {
            if ($clinic->license_file_url) {
                $this->deleteStoredFile($clinic->license_file_url);
            }
            $data['license_file_url'] = $this->storeFile($request, 'license_file', 'licenses');
        }

        if ($request->hasFile('cert_file')) {
            if ($clinic->cert_file_url) {
                $this->deleteStoredFile($clinic->cert_file_url);
            }
            $data['cert_file_url'] = $this->storeFile($request, 'cert_file', 'certifications');
        }

        if ($request->hasFile('profile_photo')) {
            if ($clinic->profile_photo_url) {
                $this->deleteStoredFile($clinic->profile_photo_url);
            }
            $data['profile_photo_url'] = $this->storeFile($request, 'profile_photo', 'clinic-photos');
        }

        if ($request->hasFile('cover_photo')) {
            if ($user->cover_photo_url) {
                $this->deleteStoredFile($user->cover_photo_url);
            }
            $user->update(['cover_photo_url' => $this->storeFile($request, 'cover_photo', 'covers')]);
        }

        unset($data['license_file'], $data['cert_file'], $data['profile_photo'], $data['cover_photo']);
        $clinic->update($data);

        Cache::forget("clinic_profile_{$user->id}");

        $fresh = $clinic->fresh()->toArray();
        $fresh['cover_photo_url'] = $user->fresh()->cover_photo_url;
        return response()->json($fresh);
    }

    private function storeFile(Request $request, string $field, string $folder): string
    {
        $file     = $request->file($field);
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs($folder, $filename, 'public');

        return Storage::disk('public')->url($path);
    }

    private function deleteStoredFile(string $url): void
    {
        $relativePath = Str::after(parse_url($url, PHP_URL_PATH), '/storage/');
        if (!preg_match('#^(client-photos|clinic-photos|covers|licenses|certifications)/#', $relativePath)) {
            return;
        }
        Storage::disk('public')->delete($relativePath);
    }
}
