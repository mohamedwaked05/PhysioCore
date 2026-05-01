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
        $userId  = $request->user()->id;
        $profile = Cache::remember("client_profile_{$userId}", 60, fn() => $request->user()->clientProfile);
        return response()->json($profile);
    }

    public function update(UpdateProfileRequest $request)
    {
        $profile = $request->user()->clientProfile;
        $data    = $request->validated();

        if ($request->hasFile('profile_photo')) {
            if ($profile->profile_photo_url) {
                $this->deleteStoredFile($profile->profile_photo_url);
            }
            $data['profile_photo_url'] = $this->storePhoto($request, 'profile_photo', 'client-photos');
        }

        unset($data['profile_photo']);
        $profile->update($data);

        Cache::forget("client_profile_{$request->user()->id}");

        return response()->json($profile->fresh());
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
        Storage::disk('public')->delete($relativePath);
    }
}
