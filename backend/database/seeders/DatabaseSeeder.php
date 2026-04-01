<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\ClientProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Client ---
        $client = User::create([
            'first_name'        => 'John',
            'last_name'         => 'Client',
            'email'             => 'client@test.com',
            'password_hash'     => Hash::make('password'),
            'role'              => 'client',
            'status'            => 'active',
            'provider'          => 'local',
            'email_verified_at' => now(),
        ]);
        ClientProfile::create(['user_id' => $client->id]);

        // --- Clinic ---
        $clinic = User::create([
            'first_name'        => 'Jane',
            'last_name'         => 'Clinic',
            'email'             => 'clinic@test.com',
            'password_hash'     => Hash::make('password'),
            'role'              => 'clinic',
            'status'            => 'active',
            'provider'          => 'local',
            'email_verified_at' => now(),
        ]);
        Clinic::create([
            'user_id' => $clinic->id,
            'name'    => 'Jane Clinic',
            'status'  => 'pending',
        ]);

        // --- Admin ---
        User::create([
            'first_name'        => 'Super',
            'last_name'         => 'Admin',
            'email'             => 'admin@test.com',
            'password_hash'     => Hash::make('password'),
            'role'              => 'admin',
            'status'            => 'active',
            'provider'          => 'local',
            'email_verified_at' => now(),
        ]);
    }
}
