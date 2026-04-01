// database/migrations/xxxx_create_users_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('password_hash')->nullable(); // nullable for Google users
            $table->enum('role', ['client', 'clinic', 'admin'])->default('client');
            $table->enum('status', ['active', 'suspended', 'pending'])->default('active');
            $table->string('google_id')->nullable()->unique();
            $table->enum('provider', ['local', 'google'])->default('local');
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};