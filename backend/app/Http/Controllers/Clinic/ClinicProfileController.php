<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\StoreClinicProfileRequest;
use App\Http\Requests\Clinic\UpdateClinicProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ClinicProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->clinic);
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

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_url'] = $this->storeFile($request, 'profile_photo', 'clinic-photos');
        }

        unset($data['license_file'], $data['profile_photo']);
        $clinic->update($data);

        return response()->json($clinic->fresh(), 201);
    }

    public function update(UpdateClinicProfileRequest $request)
    {
        $clinic = $request->user()->clinic;
        $data   = $request->validated();

        if ($request->hasFile('license_file')) {
            if ($clinic->license_file_url) {
                $this->deleteStoredFile($clinic->license_file_url);
            }
            $data['license_file_url'] = $this->storeFile($request, 'license_file', 'licenses');
        }

        if ($request->hasFile('profile_photo')) {
            if ($clinic->profile_photo_url) {
                $this->deleteStoredFile($clinic->profile_photo_url);
            }
            $data['profile_photo_url'] = $this->storeFile($request, 'profile_photo', 'clinic-photos');
        }

        unset($data['license_file'], $data['profile_photo']);
        $clinic->update($data);

        return response()->json($clinic->fresh());
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
        $relativePath = ltrim(parse_url($url, PHP_URL_PATH), '/storage/');
        Storage::disk('public')->delete($relativePath);
    }
}
