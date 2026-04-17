<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rehab_plan_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rehab_plan_id')->constrained('rehab_plans')->cascadeOnDelete();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->enum('day_of_week', [
                'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
            ]);
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['rehab_plan_id', 'day_of_week']);
            $table->index('client_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rehab_plan_progress');
    }
};
