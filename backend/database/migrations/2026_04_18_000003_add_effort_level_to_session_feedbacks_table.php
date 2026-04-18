<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_feedbacks', function (Blueprint $table) {
            $table->unsignedTinyInteger('effort_level')->nullable()->after('pain_level');
        });
    }

    public function down(): void
    {
        Schema::table('session_feedbacks', function (Blueprint $table) {
            $table->dropColumn('effort_level');
        });
    }
};
