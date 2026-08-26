<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class InitialAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = config('edglo.super_admin');

        $this->createWhenMissing([
            'code' => 'A001',
            'name' => $superAdmin['name'],
            'email' => strtolower($superAdmin['email']),
            'phone' => $superAdmin['phone'],
            'role' => 'super_admin',
            'password' => $superAdmin['password'],
            'is_active' => true,
        ]);

        foreach ([
            ['A002', 'Admin EdGLO', 'admin@edglo.id', '08111333444'],
            ['A003', 'Putri Anggraini', 'putri.anggraini@edglo.id', '08111444555'],
            ['A004', 'Rina Amelia', 'rina.amelia@edglo.id', '081177420055'],
            ['A005', 'Bagus Ramadhan', 'bagus.ramadhan@edglo.id', '082211907733'],
        ] as [$code, $name, $email, $phone]) {
            $this->createWhenMissing(compact('code', 'name', 'email', 'phone') + [
                'role' => 'admin',
                'password' => 'admin123',
                'is_active' => true,
            ]);
        }
    }

    /** @param array<string, mixed> $attributes */
    private function createWhenMissing(array $attributes): void
    {
        $exists = User::query()
            ->where('code', $attributes['code'])
            ->orWhere('email', $attributes['email'])
            ->exists();

        if (! $exists) {
            User::create($attributes);
        }
    }
}
