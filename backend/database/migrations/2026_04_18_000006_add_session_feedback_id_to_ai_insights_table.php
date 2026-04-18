<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->unsignedBigInteger('session_feedback_id')->nullable()->after('clinic_id');
            $table->foreign('session_feedback_id')
                  ->references('id')->on('session_feedbacks')
                  ->onDelete('set null');

            // One safety insight per session — NULL values are excluded from uniqueness
            // in PostgreSQL, so progress insights (no session_feedback_id) are unaffected.
            $table->unique(['session_feedback_id', 'insight_type'], 'ai_insights_session_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->dropForeign(['session_feedback_id']);
            $table->dropUnique('ai_insights_session_type_unique');
            $table->dropColumn('session_feedback_id');
        });
    }
};
