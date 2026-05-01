<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->index(['rehab_plan_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->dropIndex(['rehab_plan_id', 'day_of_week']);
        });
    }
};
