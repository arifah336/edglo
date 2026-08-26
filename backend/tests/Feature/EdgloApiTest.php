<?php

namespace Tests\Feature;

use App\Models\ClassSession;
use App\Models\Program;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EdgloApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_admin_can_login_and_receive_token(): void
    {
        User::factory()->create([
            'code' => 'A001',
            'email' => 'superadmin@edglo.id',
            'password' => 'admin123',
            'role' => 'super_admin',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'superadmin@edglo.id',
            'password' => 'admin123',
            'deviceName' => 'phpunit',
        ])->assertOk()->assertJsonPath('user.role', 'super_admin')->assertJsonStructure(['token', 'user']);
    }

    public function test_regular_admin_cannot_manage_admin_accounts(): void
    {
        $admin = User::factory()->create(['code' => 'A002', 'role' => 'admin']);

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admins')->assertForbidden();
    }

    public function test_student_can_be_created_with_camel_case_payload_and_deactivated(): void
    {
        $admin = User::factory()->create(['code' => 'A001', 'role' => 'super_admin']);
        $this->seedAcademicReferences();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/students', [
            'fullName' => 'Murid Pengujian',
            'parentName' => 'Orang Tua Pengujian',
            'address' => 'Batam',
            'phone' => '081234567890',
            'programId' => 'calistung-regular',
            'sessionsPerWeek' => 3,
            'joinDate' => '2026-08-01',
            'teacherId' => 'T001',
            'schedules' => [['day' => 'Senin', 'time' => '15.00']],
        ]);

        $response->assertCreated()->assertJsonPath('data.id', 'S001')->assertJsonPath('data.fullName', 'Murid Pengujian');
        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/students/S001/deactivate', [
            'date' => '2026-08-15', 'reason' => 'Pengujian status',
        ])->assertOk()->assertJsonPath('data.status', 'off');
        $this->assertDatabaseHas('student_status_histories', ['student_id' => 'S001', 'action' => 'deactivated']);
    }

    public function test_first_payment_automatically_calculates_registration_and_book_fees(): void
    {
        $admin = User::factory()->create(['code' => 'A001', 'role' => 'super_admin']);
        $this->seedAcademicReferences();
        Student::create([
            'id' => 'S001', 'full_name' => 'Murid Tagihan', 'parent_name' => 'Orang Tua',
            'address' => 'Batam', 'phone' => '08123', 'program_id' => 'calistung-regular',
            'sessions_per_week' => 3, 'join_date' => '2026-08-10', 'teacher_id' => 'T001', 'status' => 'active',
        ]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/payments', [
            'studentId' => 'S001', 'month' => 8, 'year' => 2026, 'dueDate' => '2026-08-10',
        ])->assertCreated()
            ->assertJsonPath('data.programFee', 600000)
            ->assertJsonPath('data.registrationFee', 100000)
            ->assertJsonPath('data.bookFee', 100000)
            ->assertJsonPath('data.total', 800000);
    }

    public function test_class_sessions_are_paginated_ten_rows_by_default(): void
    {
        $admin = User::factory()->create(['code' => 'A001', 'role' => 'super_admin']);
        $this->seedAcademicReferences();

        foreach (range(1, 12) as $index) {
            ClassSession::create([
                'id' => 'CL'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'day' => 'Senin',
                'time' => sprintf('%02d:00', $index),
                'teacher_id' => 'T001',
                'program_id' => 'calistung-regular',
                'room' => 'Ruang '.(($index % 3) + 1),
                'capacity' => 8,
                'is_active' => true,
            ]);
        }

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/class-sessions')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.last_page', 2);
    }

    private function seedAcademicReferences(): void
    {
        Program::create(['id' => 'calistung-regular', 'name' => 'Calistung Regular', 'price' => 600000, 'sessions_per_week' => 3, 'is_active' => true]);
        Teacher::create([
            'id' => 'T001', 'full_name' => 'Guru Pengujian', 'address' => 'Batam',
            'birth_place' => 'Batam', 'birth_date' => '1995-01-01', 'religion' => 'Islam',
            'email' => 'guru@edglo.test', 'phone' => '08123', 'last_education' => 'S1',
            'join_date' => '2025-01-01', 'employment_type' => 'fulltime', 'status' => 'active',
        ]);
    }
}
