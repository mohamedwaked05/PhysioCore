<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->unsignedBigInteger('resolved_by')->nullable()->after('resolved_at');
            $table->text('resolution_note')->nullable()->after('resolved_by');
            $table->foreign('resolved_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('ai_insights', function (Blueprint $table) {
            $table->dropForeign(['resolved_by']);
            $table->dropColumn(['resolved_by', 'resolution_note']);
        });
    }
};
