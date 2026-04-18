<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL: drop the existing CHECK constraint and replace it with
        // one that includes the new 'safety_alert' context value.
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_context_check');
        DB::statement(
            "ALTER TABLE messages ADD CONSTRAINT messages_context_check "
            . "CHECK (context IN ('inquiry','treatment','feedback','safety_alert'))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_context_check');
        DB::statement(
            "ALTER TABLE messages ADD CONSTRAINT messages_context_check "
            . "CHECK (context IN ('inquiry','treatment','feedback'))"
        );
    }
};
