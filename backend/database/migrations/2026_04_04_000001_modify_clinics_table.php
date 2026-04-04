<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1 — Rename existing columns
        Schema::table('clinics', function (Blueprint $table) {
            $table->renameColumn('name',      'legal_name');
            $table->renameColumn('phone',     'clinic_mobile');
            $table->renameColumn('specialty', 'specialty_text');
        });

        // Step 2 — Add new columns
        Schema::table('clinics', function (Blueprint $table) {
            $table->string('commercial_name')->nullable()->after('legal_name');
            $table->string('clinic_email')->nullable()->after('commercial_name');
            $table->string('tax_id', 100)->nullable()->after('address');
            $table->string('license_file_url')->nullable()->after('license_number');
            $table->string('verification_status')->default('pending')->after('license_file_url');
        });

        // Step 3 — Migrate status data: verified → approved, others carry over
        DB::statement("
            UPDATE clinics
            SET verification_status = CASE
                WHEN status = 'verified' THEN 'approved'
                ELSE status
            END
        ");

        // Step 4 — Drop old status column
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->renameColumn('legal_name',    'name');
            $table->renameColumn('clinic_mobile', 'phone');
            $table->renameColumn('specialty_text','specialty');
            $table->dropColumn([
                'commercial_name',
                'clinic_email',
                'tax_id',
                'license_file_url',
                'verification_status',
            ]);
            $table->string('status')->default('pending');
        });
    }
};
