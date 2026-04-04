<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->string('nickname', 100)->nullable()->after('user_id');
            $table->string('language', 100)->nullable()->after('gender');
            $table->string('country', 100)->nullable()->after('language');
            $table->string('timezone', 100)->nullable()->after('country');
            $table->string('profile_photo_url')->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->dropColumn(['nickname', 'language', 'country', 'timezone', 'profile_photo_url']);
        });
    }
};
