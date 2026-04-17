<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rehab_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->string('injury_type');
            $table->timestamps();

            $table->index('clinic_id');
            $table->index('client_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rehab_plans');
    }
};
