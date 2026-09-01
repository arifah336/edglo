<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\EdgloSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiIntegrationCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_frontend_bootstrap_collections_and_dashboard_are_available(): void
    {
        $this->getJson('/api/v1/bootstrap')->assertUnauthorized();
        $this->authenticateSuperAdmin();

        $this->getJson('/api/v1/bootstrap')
            ->assertOk()
            ->assertJsonPath('data.user.role', 'super_admin')
            ->assertJsonCount(7, 'data.programs')
            ->assertJsonCount(20, 'data.students')
            ->assertJsonCount(8, 'data.teachers')
            ->assertJsonCount(49, 'data.sessions')
            ->assertJsonCount(5, 'data.admins')
            ->assertJsonStructure(['data' => ['user', 'programs', 'students', 'teachers', 'sessions', 'payments', 'admins']]);

        $this->getJson('/api/v1/programs?per_page=100')->assertOk()->assertJsonCount(7, 'data');
        $this->getJson('/api/v1/students?per_page=100')->assertOk()->assertJsonCount(20, 'data');
        $this->getJson('/api/v1/teachers?per_page=100')->assertOk()->assertJsonCount(8, 'data');
        $this->getJson('/api/v1/class-sessions?per_page=100')
            ->assertOk()
            ->assertJsonPath('meta.total', 49);
        $this->getJson('/api/v1/payments?per_page=100')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
        $this->getJson('/api/v1/admins?per_page=100')
            ->assertOk()
            ->assertJsonPath('meta.total', 5);
        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['students', 'teachers', 'finance', 'schedule', 'programDistribution', 'paymentReminders', 'latestStudents']]);
        $this->getJson('/api/v1/reports/overview?month=7&year=2026')
            ->assertOk()
            ->assertJsonStructure(['data' => ['activeStudents', 'totalStudents', 'activeTeachers', 'totalTeachers', 'received', 'outstanding', 'programs']]);
    }

    public function test_teacher_lifecycle_is_supported_by_the_api(): void
    {
        $this->authenticateSuperAdmin();
        $payload = [
            'fullName' => 'Guru Integrasi',
            'address' => 'Batam Center',
            'birthPlace' => 'Batam',
            'birthDate' => '1995-05-20',
            'religion' => 'Islam',
            'email' => 'guru.integrasi@edglo.test',
            'phone' => '081299990001',
            'lastEducation' => 'S1',
            'joinDate' => '2026-08-01',
            'employmentType' => 'parttime',
        ];

        $created = $this->postJson('/api/v1/teachers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.id', 'T009')
            ->assertJsonPath('data.status', 'active');

        $this->putJson('/api/v1/teachers/T009', [...$payload, 'phone' => '081299990002'])
            ->assertOk()
            ->assertJsonPath('data.phone', '081299990002');
        $this->postJson('/api/v1/teachers/T009/deactivate', ['date' => '2026-08-20', 'reason' => 'Pengujian integrasi'])
            ->assertOk()
            ->assertJsonPath('data.status', 'off');
        $this->postJson('/api/v1/teachers/T009/activate', ['date' => '2026-08-21'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
        $this->deleteJson('/api/v1/teachers/T009')->assertOk();

        $this->assertDatabaseMissing('teachers', ['id' => $created->json('data.id')]);
    }

    public function test_admin_bootstrap_does_not_expose_admin_management_data(): void
    {
        $this->seed(EdgloSeeder::class);
        $admin = User::where('role', 'admin')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/bootstrap')
            ->assertOk()
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonCount(0, 'data.admins');
    }

    public function test_class_session_create_update_and_delete_are_persisted(): void
    {
        $this->authenticateSuperAdmin();
        $payload = [
            'day' => 'Sabtu',
            'time' => '20.00',
            'teacherId' => 'T001',
            'programId' => 'calistung-regular',
            'studentIds' => ['S001'],
            'room' => 'Ruang Integrasi',
            'capacity' => 6,
            'notes' => 'Dibuat oleh pengujian API',
        ];

        $sessionId = $this->postJson('/api/v1/class-sessions', $payload)
            ->assertCreated()
            ->assertJsonPath('data.studentIds.0', 'S001')
            ->json('data.id');

        $this->putJson("/api/v1/class-sessions/{$sessionId}", [...$payload, 'time' => '20.30', 'room' => 'Ruang Integrasi B'])
            ->assertOk()
            ->assertJsonPath('data.time', '20.30')
            ->assertJsonPath('data.room', 'Ruang Integrasi B');
        $this->deleteJson("/api/v1/class-sessions/{$sessionId}")->assertOk();

        $this->assertDatabaseMissing('class_sessions', ['id' => $sessionId]);
    }

    public function test_payment_creation_generation_summary_and_settlement_are_connected(): void
    {
        $this->authenticateSuperAdmin();

        $paymentId = $this->postJson('/api/v1/payments', [
            'studentId' => 'S001',
            'month' => 9,
            'year' => 2026,
            'dueDate' => '2026-09-10',
        ])->assertCreated()
            ->assertJsonPath('data.programFee', 600000)
            ->json('data.id');

        $this->postJson("/api/v1/payments/{$paymentId}/mark-paid", ['paid_date' => '2026-09-10'])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
        $this->postJson('/api/v1/payments/generate-month', ['month' => 10, 'year' => 2026])
            ->assertOk()
            ->assertJsonStructure(['message', 'created']);
        $this->getJson('/api/v1/payments/summary?year=2026')
            ->assertOk()
            ->assertJsonStructure(['data' => ['billed', 'received', 'outstanding', 'paidCount', 'pendingCount', 'overdueCount']]);
    }

    public function test_admin_profile_password_and_pdf_report_endpoints_work(): void
    {
        $admin = $this->authenticateSuperAdmin();

        $createdId = $this->postJson('/api/v1/admins', [
            'name' => 'Admin Integrasi',
            'email' => 'admin.integrasi@edglo.test',
            'phone' => '081299990003',
            'role' => 'admin',
            'password' => '!!!!!!!!',
            'password_confirmation' => '!!!!!!!!',
        ])->assertCreated()->json('data.id');

        $this->putJson("/api/v1/admins/{$createdId}", [
            'name' => 'Admin Integrasi Diperbarui',
            'email' => 'admin.integrasi@edglo.test',
            'phone' => '081299990004',
            'role' => 'admin',
        ])->assertOk()->assertJsonPath('data.name', 'Admin Integrasi Diperbarui');
        $this->patchJson('/api/v1/auth/profile', [
            'name' => 'Super Admin Pengujian',
            'email' => $admin->email,
            'phone' => '081200000099',
        ])->assertOk()->assertJsonPath('data.name', 'Super Admin Pengujian');
        $this->putJson('/api/v1/auth/password', [
            'current_password' => config('edglo.super_admin.password'),
            'password' => 'PasswordBaru123',
            'password_confirmation' => 'PasswordBaru123',
        ])->assertOk();
        $this->get('/api/v1/reports/download?type=teachers&paper=a4&orientation=landscape')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
        $this->deleteJson("/api/v1/admins/{$createdId}")->assertOk();
    }

    private function authenticateSuperAdmin(): User
    {
        $this->seed(EdgloSeeder::class);
        $admin = User::where('code', 'A001')->firstOrFail();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }
}
