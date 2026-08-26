<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\InitialAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InitialAdminSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_the_configured_super_admin_when_missing(): void
    {
        config()->set('edglo.super_admin', [
            'name' => 'Pemilik EdGLO',
            'email' => 'owner@edglo.id',
            'password' => 'Rahasia123',
            'phone' => '081200000001',
        ]);

        $this->seed(InitialAdminSeeder::class);

        $admin = User::where('email', 'owner@edglo.id')->firstOrFail();
        $this->assertSame('A001', $admin->code);
        $this->assertSame('super_admin', $admin->role);
        $this->assertTrue($admin->is_active);
        $this->assertTrue(Hash::check('Rahasia123', $admin->password));
    }

    public function test_it_does_not_duplicate_or_reset_an_existing_super_admin(): void
    {
        config()->set('edglo.super_admin', [
            'name' => 'Super Admin EdGLO',
            'email' => 'superadmin@edglo.id',
            'password' => 'Initial123',
            'phone' => '08111222333',
        ]);

        $this->seed(InitialAdminSeeder::class);
        User::where('code', 'A001')->firstOrFail()->update(['password' => 'Changed123']);
        $this->seed(InitialAdminSeeder::class);

        $this->assertSame(1, User::where('code', 'A001')->count());
        $this->assertTrue(Hash::check('Changed123', User::where('code', 'A001')->firstOrFail()->password));
    }
}
