<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rehab_plan_exercise_id')->constrained('rehab_plan_exercises')->cascadeOnDelete();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->date('session_date');
            $table->timestamps();

            $table->unique(['rehab_plan_exercise_id', 'client_profile_id', 'session_date']);
            $table->index(['client_profile_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_logs');
    }
};
