<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->string('profile_photo_url')->nullable()->after('license_file_url');
            $table->text('certifications')->nullable()->after('description');
            $table->string('experience', 255)->nullable()->after('certifications');
            $table->string('payment_methods', 255)->nullable()->after('experience');
            $table->text('services')->nullable()->after('payment_methods');
            $table->string('working_hours', 255)->nullable()->after('services');
            $table->string('social_media_link', 255)->nullable()->after('working_hours');
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn([
                'profile_photo_url',
                'certifications',
                'experience',
                'payment_methods',
                'services',
                'working_hours',
                'social_media_link',
            ]);
        });
    }
};
