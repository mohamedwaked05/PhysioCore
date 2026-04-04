<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\UpdateProfileRequest;
use Illuminate\Http\Request;

class ClientProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->clientProfile);
    }

    public function update(UpdateProfileRequest $request)
    {
        $profile = $request->user()->clientProfile;
        $profile->update($request->validated());

        return response()->json($profile);
    }
}
