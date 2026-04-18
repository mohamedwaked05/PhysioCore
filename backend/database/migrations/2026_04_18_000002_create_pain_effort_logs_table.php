<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pain_effort_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->unsignedTinyInteger('pain_level');
            $table->unsignedTinyInteger('effort_level');
            $table->date('session_date');
            $table->timestamps();

            $table->unique(['client_profile_id', 'clinic_id', 'session_date']);
            $table->index(['clinic_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pain_effort_logs');
    }
};
