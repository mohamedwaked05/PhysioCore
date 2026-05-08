<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->string('video_url')->nullable()->after('alternative_exercise');
        });
    }

    public function down(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->dropColumn('video_url');
        });
    }
};
