<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\UpdateProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            if ($profile->profile_photo_url) {
                $this->deleteStoredFile($profile->profile_photo_url);
            }
            $data['profile_photo_url'] = $this->storePhoto($request, 'profile_photo', 'client-photos');
        }

        if ($request->hasFile('cover_photo')) {
            if ($user->cover_photo_url) {
                $this->deleteStoredFile($user->cover_photo_url);
            }
            $user->update(['cover_photo_url' => $this->storePhoto($request, 'cover_photo', 'covers')]);
        }

        unset($data['profile_photo'], $data['cover_photo']);
        $profile->update($data);

        Cache::forget("client_profile_{$user->id}");

        $fresh = $profile->fresh()->toArray();
        $fresh['cover_photo_url'] = $user->fresh()->cover_photo_url;
        return response()->json($fresh);
    }

    private function storePhoto(Request $request, string $field, string $folder): string
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
