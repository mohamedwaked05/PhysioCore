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
            $data['license_file_url'] = $this->storeLicenseFile($request);
        }

        $clinic->update($data);

        return response()->json($clinic, 201);
    }

    public function update(UpdateClinicProfileRequest $request)
    {
        $clinic = $request->user()->clinic;

        $data = $request->validated();

        if ($request->hasFile('license_file')) {
            if ($clinic->license_file_url) {
                Storage::disk('public')->delete($clinic->license_file_url);
            }
            $data['license_file_url'] = $this->storeLicenseFile($request);
        }

        $clinic->update($data);

        return response()->json($clinic);
    }

    private function storeLicenseFile(Request $request): string
    {
        $file     = $request->file('license_file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        return $file->storeAs('licenses', $filename, 'public');
    }
}
