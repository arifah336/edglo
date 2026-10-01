<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\EdgloSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_enters_admin_queue_without_creating_parent_account(): void
    {
        $this->seed(EdgloSeeder::class);
        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:00'));

        $response = $this->postJson('/api/v1/registrations', [
            'parentName' => 'Rani Pratama',
            'email' => 'rani.parent@edglo.test',
            'phone' => '081234000111',
            'childName' => 'Nara Pratama',
            'childAge' => 8,
            'address' => 'Batam Center',
            'programSelections' => [
                ['programId' => 'calistung-regular', 'months' => 2],
                ['programId' => 'english-regular', 'months' => 3],
            ],
            'preferredSchedules' => [
                ['day' => 'Senin', 'time' => '15:00'],
                ['day' => 'Rabu', 'time' => '16:30'],
            ],
            'notes' => 'Perlu pendampingan membaca.',
        ])->assertCreated()
            ->assertJsonPath('registration.status', 'pending')
            ->assertJsonPath('registration.parent.name', 'Rani Pratama')
            ->assertJsonPath('registration.programSelections.0.months', 2)
            ->assertJsonPath('registration.programSelections.1.programName', 'English Regular')
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('user');

        $this->assertDatabaseMissing('users', ['email' => 'rani.parent@edglo.test']);
        $this->assertDatabaseHas('course_registrations', [
            'id' => $response->json('registration.id'),
            'parent_user_id' => null,
            'parent_phone' => '081234000111',
            'status' => 'pending',
        ]);

        $admin = User::query()->where('role', 'admin')->firstOrFail();
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/registrations?per_page=100')
            ->assertOk()
            ->assertJsonPath('data.0.childName', 'Nara Pratama');

        $approval = $this->postJson('/api/v1/registrations/'.$response->json('registration.id').'/approve', [
            'joinDate' => '2026-10-01',
            'adminNotes' => 'Data dan pilihan paket sudah dikonfirmasi.',
        ])->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('students', [
            'id' => $approval->json('data.studentId'),
            'parent_user_id' => null,
            'full_name' => 'Nara Pratama',
            'status' => 'active',
        ]);
        $approvedStudent = Student::query()->findOrFail($approval->json('data.studentId'));
        $this->assertSame('2026-10-01', $approvedStudent->package_started_at?->toDateString());
        $this->assertSame('2026-12-31', $approvedStudent->package_ends_at?->toDateString());
    }

    public function test_expired_package_is_automatically_deactivated_when_admin_loads_students(): void
    {
        $this->seed(EdgloSeeder::class);
        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:00'));

        $student = Student::query()->where('status', 'active')->firstOrFail();
        $student->update([
            'package_started_at' => '2026-08-01',
            'package_ends_at' => '2026-09-30',
        ]);

        $admin = User::query()->where('role', 'admin')->firstOrFail();
        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/students?per_page=100')->assertOk();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'status' => 'off',
        ]);
        $this->assertSame('2026-09-30', $student->fresh()->leave_date?->toDateString());
        $this->assertDatabaseHas('student_status_histories', [
            'student_id' => $student->id,
            'action' => 'deactivated',
            'changed_by_name' => 'Sistem EdGLO',
        ]);
    }

    public function test_parent_portal_routes_are_not_exposed(): void
    {
        $this->postJson('/api/v1/auth/parent/login', [
            'email' => 'parent@edglo.test',
            'password' => 'password',
        ])->assertNotFound();

        $this->getJson('/api/v1/parent/overview')->assertNotFound();
    }
}
