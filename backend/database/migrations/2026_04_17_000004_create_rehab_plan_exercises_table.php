<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rehab_plan_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rehab_plan_id')->constrained('rehab_plans')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('sets');
            $table->unsignedSmallInteger('reps');
            $table->text('notes')->nullable();
            $table->string('alternative_exercise')->nullable();
            $table->timestamps();

            $table->index('rehab_plan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rehab_plan_exercises');
    }
};
