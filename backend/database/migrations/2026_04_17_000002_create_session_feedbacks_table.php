<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->nullable();        // 1–5 stars
            $table->unsignedTinyInteger('pain_level')->nullable();    // 1–10, future use
            $table->text('feedback_text')->nullable();
            $table->unsignedSmallInteger('exercises_completed')->default(0);
            $table->unsignedSmallInteger('exercises_total')->default(0);
            $table->date('session_date');
            $table->timestamps();

            $table->index(['client_profile_id', 'session_date']);
            $table->index(['clinic_id', 'client_profile_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_feedbacks');
    }
};
