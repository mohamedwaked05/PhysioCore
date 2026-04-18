<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->timestamp('resolved_at')->nullable()->after('severity');
            $table->index('resolved_at');
        });
    }

    public function down(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->dropIndex(['resolved_at']);
            $table->dropColumn('resolved_at');
        });
    }
};
