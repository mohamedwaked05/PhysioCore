<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pain_effort_logs', function (Blueprint $table) {
            $table->index(['client_profile_id', 'clinic_id', 'session_date'], 'pel_client_clinic_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('pain_effort_logs', function (Blueprint $table) {
            $table->dropIndex('pel_client_clinic_date_idx');
        });
    }
};
