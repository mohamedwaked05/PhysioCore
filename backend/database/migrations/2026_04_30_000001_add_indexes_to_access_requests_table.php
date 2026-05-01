<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('access_requests', function (Blueprint $table) {
            $table->index(['clinic_id', 'status']);
            $table->index(['client_profile_id', 'clinic_id']);
        });
    }

    public function down(): void
    {
        Schema::table('access_requests', function (Blueprint $table) {
            $table->dropIndex(['clinic_id', 'status']);
            $table->dropIndex(['client_profile_id', 'clinic_id']);
        });
    }
};
