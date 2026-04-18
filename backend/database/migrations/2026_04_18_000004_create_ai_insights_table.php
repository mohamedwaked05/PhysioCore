<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('insight_type', 20)->default('session'); // session | progress
            $table->unsignedSmallInteger('adherence_score')->nullable();
            $table->string('pain_trend', 20)->nullable();       // improving | stable | worsening
            $table->string('recovery_status', 20)->nullable();  // good | moderate | poor
            $table->boolean('safety_flag')->default(false);
            $table->string('flag_reason', 500)->nullable();
            $table->string('severity', 20)->nullable();         // warning | critical
            $table->timestamps();

            $table->index(['client_profile_id', 'clinic_id', 'created_at']);
            $table->index(['clinic_id', 'safety_flag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
