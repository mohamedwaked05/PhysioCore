<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\UpdateProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ClientProfileController extends Controller
{
    public function show(Request $request)
    {
        $user    = $request->user();
        $userId  = $user->id;
        $profile = Cache::remember("client_profile_{$userId}", 60, fn() => $user->clientProfile);
        $data    = $profile ? $profile->toArray() : [];
        $data['cover_photo_url'] = $user->cover_photo_url;
        return response()->json($data);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user    = $request->user();
        $profile = $user->clientProfile;
        $data    = $request->validated();

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_url'] = $this->fileToBase64($request->file('profile_photo'));
        }

        if ($request->hasFile('cover_photo')) {
            $user->update(['cover_photo_url' => $this->fileToBase64($request->file('cover_photo'))]);
        }

        unset($data['profile_photo'], $data['cover_photo']);
        $profile->update($data);

        Cache::forget("client_profile_{$user->id}");

        $fresh = $profile->fresh()->toArray();
        $fresh['cover_photo_url'] = $user->fresh()->cover_photo_url;
        return response()->json($fresh);
    }

    /**
     * Convert uploaded image to a compressed JPEG base64 data URI.
     * Resizes to max 800px on either axis to keep payloads small.
     * Stored directly in the DB — survives Railway redeploys.
     */
    private function fileToBase64(\Illuminate\Http\UploadedFile $file): string
    {
        $maxDim  = 800;
        $quality = 80;

        $src = imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (!$src) {
            // Fallback: store raw base64 without resize
            return 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));
        }

        $w = imagesx($src);
        $h = imagesy($src);

        if ($w > $maxDim || $h > $maxDim) {
            $ratio  = $w > $h ? $maxDim / $w : $maxDim / $h;
            $newW   = (int) round($w * $ratio);
            $newH   = (int) round($h * $ratio);
            $dst    = imagecreatetruecolor($newW, $newH);
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
