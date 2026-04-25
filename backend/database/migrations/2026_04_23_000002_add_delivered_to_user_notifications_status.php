<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL stores Laravel enum() as VARCHAR + CHECK constraint
        DB::statement('ALTER TABLE user_notifications DROP CONSTRAINT IF EXISTS user_notifications_status_check');
        DB::statement("ALTER TABLE user_notifications ADD CONSTRAINT user_notifications_status_check CHECK (status IN ('unread','delivered','seen'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE user_notifications DROP CONSTRAINT IF EXISTS user_notifications_status_check');
        DB::statement("ALTER TABLE user_notifications ADD CONSTRAINT user_notifications_status_check CHECK (status IN ('unread','seen'))");
    }
};
