<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rehab_plans', function (Blueprint $table) {
            $table->unsignedTinyInteger('week_number')->default(1)->after('injury_type');
            $table->date('start_date')->nullable()->after('week_number');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('rehab_plans', function (Blueprint $table) {
            $table->dropColumn(['week_number', 'start_date', 'end_date']);
        });
    }
};
