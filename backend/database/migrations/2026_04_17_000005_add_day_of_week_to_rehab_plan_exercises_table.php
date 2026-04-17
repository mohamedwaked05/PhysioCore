<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->enum('day_of_week', [
                'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
            ])->default('monday')->after('rehab_plan_id');
        });
    }

    public function down(): void
    {
        Schema::table('rehab_plan_exercises', function (Blueprint $table) {
            $table->dropColumn('day_of_week');
        });
    }
};
