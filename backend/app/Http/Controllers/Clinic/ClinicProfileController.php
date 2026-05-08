<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\StoreClinicProfileRequest;
use App\Http\Requests\Clinic\UpdateClinicProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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
            $data['license_file_url'] = $this->storeFile($request->file('license_file'), 'licenses');
        }

        if ($request->hasFile('cert_file')) {
            $data['cert_file_url'] = $this->storeFile($request->file('cert_file'), 'certifications');
        }

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_url'] = $this->fileToBase64($request->file('profile_photo'));
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
            $data['license_file_url'] = $this->storeFile($request->file('license_file'), 'licenses');
        }

        if ($request->hasFile('cert_file')) {
            $data['cert_file_url'] = $this->storeFile($request->file('cert_file'), 'certifications');
        }

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_url'] = $this->fileToBase64($request->file('profile_photo'));
        }

        if ($request->hasFile('cover_photo')) {
            $user->update(['cover_photo_url' => $this->fileToBase64($request->file('cover_photo'))]);
        }

        unset($data['license_file'], $data['cert_file'], $data['profile_photo'], $data['cover_photo']);
        $clinic->update($data);

        Cache::forget("clinic_profile_{$user->id}");

        $fresh = $clinic->fresh()->toArray();
        $fresh['cover_photo_url'] = $user->fresh()->cover_photo_url;
        return response()->json($fresh);
    }

    /** Store non-image files (PDF licenses) on the filesystem as before. */
    private function storeFile(UploadedFile $file, string $folder): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs($folder, $filename, 'public');
        return Storage::disk('public')->url($path);
    }

    /**
     * Convert uploaded image to a compressed JPEG base64 data URI.
     * Resizes to max 800px, stored in DB — survives Railway redeploys.
     */
    private function fileToBase64(UploadedFile $file): string
    {
        $maxDim  = 800;
        $quality = 80;

        $src = imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (!$src) {
            return 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));
        }

        $w = imagesx($src);
        $h = imagesy($src);

        if ($w > $maxDim || $h > $maxDim) {
            $ratio = $w > $h ? $maxDim / $w : $maxDim / $h;
            $newW  = (int) round($w * $ratio);
            $newH  = (int) round($h * $ratio);
            $dst   = imagecreatetruecolor($newW, $newH);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);
            imagedestroy($src);
            $src = $dst;
        }

        ob_start();
        imagejpeg($src, null, $quality);
        $jpeg = ob_get_clean();
        imagedestroy($src);

        return 'data:image/jpeg;base64,' . base64_encode($jpeg);
    }
}
