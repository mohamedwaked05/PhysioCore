<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // client_profiles.profile_photo_url
        DB::statement('ALTER TABLE client_profiles ALTER COLUMN profile_photo_url TYPE TEXT');

        // clinics.profile_photo_url
        DB::statement('ALTER TABLE clinics ALTER COLUMN profile_photo_url TYPE TEXT');

        // users.cover_photo_url (added in prior migration)
        DB::statement('ALTER TABLE users ALTER COLUMN cover_photo_url TYPE TEXT');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE client_profiles ALTER COLUMN profile_photo_url TYPE VARCHAR(255)');
        DB::statement('ALTER TABLE clinics ALTER COLUMN profile_photo_url TYPE VARCHAR(255)');
        DB::statement('ALTER TABLE users ALTER COLUMN cover_photo_url TYPE VARCHAR(255)');
    }
};
