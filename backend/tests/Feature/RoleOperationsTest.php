<?php

namespace Tests\Feature;

use App\Models\ClassSession;
use App\Models\User;
use Database\Seeders\EdgloSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_and_admin_permissions_follow_the_operational_matrix(): void
    {
        $this->seed(EdgloSeeder::class);
        $owner = User::where('role', 'super_admin')->firstOrFail();
        $admin = User::where('role', 'admin')->firstOrFail();

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/students', [])
            ->assertForbidden();
        $this->postJson('/api/v1/class-sessions', [])->assertForbidden();
        $this->postJson('/api/v1/payments', [])->assertForbidden();
        $this->postJson('/api/v1/teacher-attendances', [])->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/teachers', [])
            ->assertForbidden();
        $this->postJson('/api/v1/teachers/T001/deactivate', [])->assertForbidden();
        $this->postJson('/api/v1/teacher-payrolls', [])->assertForbidden();
        $this->getJson('/api/v1/admins')->assertForbidden();
    }

    public function test_admin_records_attendance_and_makeup_then_owner_creates_payroll(): void
    {
        $this->seed(EdgloSeeder::class);
        $admin = User::where('role', 'admin')->firstOrFail();
        $owner = User::where('role', 'super_admin')->firstOrFail();
        $session = ClassSession::with('students')->whereHas('students')->firstOrFail();
        $student = $session->students->firstOrFail();

        $this->actingAs($admin, 'sanctum');
        $this->postJson('/api/v1/teacher-attendances', [
            'teacherId' => $session->teacher_id,
            'classSessionId' => $session->id,
            'attendanceDate' => '2026-09-23',
            'status' => 'present',
            'notes' => 'Hadir sesuai jadwal.',
        ])->assertCreated()
            ->assertJsonPath('data.teacherId', $session->teacher_id)
            ->assertJsonPath('data.status', 'present');

        $absenceId = $this->postJson('/api/v1/student-absences', [
            'studentId' => $student->id,
            'classSessionId' => $session->id,
            'absenceDate' => '2026-09-23',
            'reason' => 'Izin keluarga.',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'open')
            ->json('data.id');

        $this->postJson('/api/v1/make-up-schedules', [
            'studentAbsenceId' => $absenceId,
            'scheduledDate' => '2026-09-27',
            'time' => '18:45',
            'room' => 'Ruang 2',
            'notes' => 'Disepakati orang tua.',
        ])->assertCreated()
            ->assertJsonPath('data.studentId', $student->id)
            ->assertJsonPath('data.teacherId', $session->teacher_id)
            ->assertJsonPath('data.status', 'scheduled');

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/teacher-payrolls', [
                'teacherId' => $session->teacher_id,
                'month' => 9,
                'year' => 2026,
                'baseSalary' => 1000000,
                'ratePerSession' => 75000,
                'allowance' => 50000,
                'deduction' => 0,
                'status' => 'final',
            ])->assertCreated()
            ->assertJsonPath('data.attendanceCount', 1)
            ->assertJsonPath('data.total', 1125000)
            ->assertJsonPath('data.status', 'final');
    }
}
