<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->unsignedInteger('min_price')->nullable()->after('social_media_link');
            $table->unsignedInteger('max_price')->nullable()->after('min_price');
            $table->string('estimated_response_time', 100)->nullable()->after('max_price');
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['min_price', 'max_price', 'estimated_response_time']);
        });
    }
};
