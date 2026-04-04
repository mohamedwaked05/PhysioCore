<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->string('condition_summary', 500)->nullable()->after('address');
            $table->text('injury_details')->nullable()->after('condition_summary');
            $table->string('emergency_contact', 255)->nullable()->after('current_medications');
        });
    }

    public function down(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->dropColumn(['condition_summary', 'injury_details', 'emergency_contact']);
        });
    }
};
