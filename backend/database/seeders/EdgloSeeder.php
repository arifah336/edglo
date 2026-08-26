<?php

namespace Database\Seeders;

use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Program;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EdgloSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->call(InitialAdminSeeder::class);
            $this->seedPrograms();
            $this->seedTeachers();
            $this->seedStudents();
            $this->seedClassSessions();
        });

        $service = app(PaymentService::class);
        foreach (range(1, 8) as $month) {
            $service->generateMonth($month, 2026, User::where('code', 'A001')->value('id'));
        }
        Payment::query()->orderBy('id')->get()->each(function (Payment $payment, int $index) {
            if (($index + 1) % 5 !== 0) {
                $payment->update(['status' => 'paid', 'paid_date' => $payment->due_date]);
                $payment->reminders()->update(['status' => 'cancelled']);
            }
        });
    }

    private function seedPrograms(): void
    {
        foreach ([
            ['pra-calistung-regular', 'Pra Calistung Regular', 700000, 3], ['calistung-regular', 'Calistung Regular', 600000, 3],
            ['calistung-everyday', 'Calistung Everyday', 1000000, 5], ['bimbel-regular', 'Bimbel Regular', 600000, 3],
            ['bimbel-everyday', 'Bimbel Everyday', 1000000, 5], ['english-regular', 'English Regular', 500000, 3],
            ['english-everyday', 'English Everyday', 900000, 5],
        ] as [$id, $name, $price, $sessions]) {
            Program::create(['id' => $id, 'name' => $name, 'price' => $price, 'sessions_per_week' => $sessions, 'is_active' => true]);
        }
    }

    private function seedTeachers(): void
    {
        $teachers = [
            ['T001', 'Siti Rahmawati, S.Pd', 'Batam', '1995-03-14', 'Islam', 'siti.rahmawati@edglo.id', '08123456789', 'S1', '2022-01-10', null, 'fulltime', 'active'],
            ['T002', 'Ahmad Fauzi', 'Padang', '1998-07-22', 'Islam', 'ahmad.fauzi@edglo.id', '08234567890', 'S1', '2022-06-01', null, 'parttime', 'active'],
            ['T003', 'Dina Lestari', 'Pekanbaru', '2000-11-05', 'Islam', 'dina.lestari@edglo.id', '08345678901', 'D3', '2023-03-15', null, 'magang', 'active'],
            ['T004', 'Rizky Pratama', 'Surabaya', '1993-05-17', 'Islam', 'rizky.pratama@edglo.id', '08456789012', 'S1', '2021-08-01', '2026-01-31', 'fulltime', 'off'],
            ['T005', 'Nabila Putri, S.Pd', 'Medan', '1996-09-10', 'Islam', 'nabila.putri@edglo.id', '08129876102', 'S1', '2024-01-08', null, 'fulltime', 'active'],
            ['T006', 'Kevin Jonathan', 'Batam', '1997-12-02', 'Kristen', 'kevin.jonathan@edglo.id', '082177340912', 'S1', '2024-08-12', null, 'parttime', 'active'],
            ['T007', 'Maya Sari', 'Jambi', '1999-04-18', 'Islam', 'maya.sari@edglo.id', '083180045112', 'D3', '2025-02-03', null, 'magang', 'active'],
            ['T008', 'Laras Widyaningrum', 'Yogyakarta', '1994-06-25', 'Katolik', 'laras.widya@edglo.id', '085271990188', 'S2', '2023-07-17', null, 'fulltime', 'active'],
        ];
        foreach ($teachers as $row) {
            [$id,$fullName,$birthPlace,$birthDate,$religion,$email,$phone,$education,$joinDate,$leaveDate,$employmentType,$status] = $row;
            $teacher = Teacher::create([
                'id' => $id, 'full_name' => $fullName, 'address' => "Alamat {$fullName}, Batam", 'birth_place' => $birthPlace,
                'birth_date' => $birthDate, 'religion' => $religion, 'email' => $email, 'phone' => $phone,
                'last_education' => $education, 'join_date' => $joinDate, 'leave_date' => $leaveDate,
                'employment_type' => $employmentType, 'status' => $status,
            ]);
            $teacher->statusHistories()->create(['date' => $joinDate, 'action' => 'activated', 'changed_by_name' => 'Super Admin EdGLO']);
            if ($status === 'off') {
                $teacher->statusHistories()->create(['date' => $leaveDate, 'action' => 'deactivated', 'reason' => 'Mengundurkan diri', 'changed_by_name' => 'Super Admin EdGLO']);
            }
        }
    }

    private function seedStudents(): void
    {
        $students = [
            ['S001', 'Aisyah Nur Fadillah', 'Bapak Wahyu Hidayat', '08567890123', 'calistung-regular', '2026-01-10', null, 'T001', 'active', [['Senin', '15.00'], ['Rabu', '15.00'], ['Jumat', '15.00']]],
            ['S002', 'Budi Santoso', 'Ibu Dewi Santoso', '08678901234', 'english-everyday', '2026-02-01', null, 'T002', 'active', [['Senin', '16.30'], ['Selasa', '16.30'], ['Rabu', '16.30'], ['Kamis', '16.30'], ['Jumat', '16.30']]],
            ['S003', 'Citra Maharani', 'Bapak Agus Maharani', '08789012345', 'bimbel-regular', '2026-01-15', null, 'T001', 'active', [['Selasa', '13.30'], ['Kamis', '13.30'], ['Sabtu', '10.30']]],
            ['S004', 'Dimas Prasetyo', 'Ibu Rina Prasetyo', '08890123456', 'pra-calistung-regular', '2025-08-01', '2026-01-31', 'T002', 'off', [['Senin', '11.00'], ['Rabu', '11.00'], ['Jumat', '11.00']]],
            ['S005', 'Elisa Putri Rahayu', 'Bapak Hendra Rahayu', '08901234567', 'english-regular', '2026-03-01', null, 'T003', 'active', [['Selasa', '15.00'], ['Kamis', '15.00'], ['Sabtu', '09.00']]],
            ['S006', 'Fajar Aditya', 'Ibu Sri Aditya', '08012345678', 'calistung-everyday', '2026-04-05', null, 'T001', 'active', [['Senin', '12.00'], ['Selasa', '12.00'], ['Rabu', '12.00'], ['Kamis', '12.00'], ['Sabtu', '12.00']]],
            ['S007', 'Ghania Az Zahra', 'Ibu Melati Sari', '081276541900', 'pra-calistung-regular', '2025-11-12', null, 'T005', 'active', [['Senin', '11.00'], ['Rabu', '11.00'], ['Jumat', '11.00']]],
            ['S008', 'Hafiz Ramadhan', 'Bapak Firman Ramadhan', '082288114579', 'bimbel-everyday', '2025-12-20', null, 'T002', 'active', [['Senin', '13.30'], ['Selasa', '13.30'], ['Rabu', '13.30'], ['Kamis', '13.30'], ['Jumat', '13.30']]],
            ['S009', 'Intan Permata Sari', 'Ibu Rika Permata', '083870221105', 'english-regular', '2026-01-22', null, 'T006', 'active', [['Selasa', '15.00'], ['Kamis', '15.00'], ['Sabtu', '09.00']]],
            ['S010', 'Jonathan Wijaya', 'Bapak Daniel Wijaya', '085215400731', 'english-everyday', '2026-02-14', null, 'T006', 'active', [['Senin', '16.30'], ['Selasa', '16.30'], ['Rabu', '16.30'], ['Kamis', '16.30'], ['Jumat', '16.30']]],
            ['S011', 'Kayla Maharani', 'Ibu Desi Maharani', '081364558702', 'calistung-regular', '2026-02-28', null, 'T005', 'active', [['Senin', '15.00'], ['Rabu', '15.00'], ['Jumat', '15.00']]],
            ['S012', 'Luthfi Al Ghifari', 'Bapak Arif Hidayat', '082193087755', 'bimbel-regular', '2026-03-07', null, 'T001', 'active', [['Selasa', '13.30'], ['Kamis', '13.30'], ['Sabtu', '10.30']]],
            ['S013', 'Mikayla Anindita', 'Ibu Sinta Anindita', '085701335890', 'pra-calistung-regular', '2026-03-18', null, 'T007', 'active', [['Senin', '12.00'], ['Rabu', '12.00'], ['Sabtu', '12.00']]],
            ['S014', 'Naufal Akbar', 'Bapak Rendi Akbar', '081266098721', 'calistung-everyday', '2026-04-10', null, 'T001', 'active', [['Senin', '12.00'], ['Selasa', '12.00'], ['Rabu', '12.00'], ['Kamis', '12.00'], ['Sabtu', '12.00']]],
            ['S015', 'Olivia Nathania', 'Ibu Grace Nathania', '082274613588', 'english-regular', '2026-05-02', null, 'T008', 'active', [['Selasa', '15.00'], ['Kamis', '15.00'], ['Sabtu', '09.00']]],
            ['S016', 'Putra Mahesa', 'Bapak Yoga Mahesa', '083192654004', 'bimbel-everyday', '2026-05-16', null, 'T008', 'active', [['Senin', '13.30'], ['Selasa', '13.30'], ['Rabu', '13.30'], ['Kamis', '13.30'], ['Jumat', '13.30']]],
            ['S017', 'Qanita Aulia', 'Ibu Farah Aulia', '085360218977', 'calistung-regular', '2026-06-05', null, 'T005', 'active', [['Senin', '15.00'], ['Rabu', '15.00'], ['Jumat', '15.00']]],
            ['S018', 'Rafi Dzaky', 'Bapak Dedi Dzaky', '081378022614', 'english-everyday', '2026-06-21', null, 'T006', 'active', [['Senin', '16.30'], ['Selasa', '16.30'], ['Rabu', '16.30'], ['Kamis', '16.30'], ['Jumat', '16.30']]],
            ['S019', 'Salsabila Putri', 'Ibu Nuraini Putri', '082167334190', 'bimbel-regular', '2025-09-09', '2026-04-30', 'T003', 'off', [['Selasa', '13.30'], ['Kamis', '13.30'], ['Sabtu', '10.30']]],
            ['S020', 'Tegar Saputra', 'Bapak Indra Saputra', '085278903144', 'pra-calistung-regular', '2025-10-03', '2026-03-31', 'T007', 'off', [['Senin', '11.00'], ['Rabu', '11.00'], ['Jumat', '11.00']]],
        ];
        foreach ($students as $row) {
            [$id,$fullName,$parentName,$phone,$programId,$joinDate,$leaveDate,$teacherId,$status,$schedules] = $row;
            $program = Program::findOrFail($programId);
            $student = Student::create([
                'id' => $id, 'full_name' => $fullName, 'parent_name' => $parentName, 'address' => "Alamat {$fullName}, Batam",
                'phone' => $phone, 'program_id' => $programId, 'sessions_per_week' => $program->sessions_per_week,
                'join_date' => $joinDate, 'leave_date' => $leaveDate, 'teacher_id' => $teacherId, 'status' => $status,
            ]);
            foreach ($schedules as [$day, $time]) {
                $student->schedules()->create(['day' => $day, 'time' => str_replace('.', ':', $time)]);
            }
            $student->statusHistories()->create(['date' => $joinDate, 'action' => 'activated', 'changed_by_name' => 'Admin EdGLO']);
            if ($status === 'off') {
                $student->statusHistories()->create(['date' => $leaveDate, 'action' => 'deactivated', 'reason' => 'Berhenti dari program', 'changed_by_name' => 'Admin EdGLO']);
            }
        }
    }

    private function seedClassSessions(): void
    {
        $groups = [];
        Student::where('status', 'active')->with('schedules')->get()->each(function (Student $student) use (&$groups) {
            foreach ($student->schedules as $schedule) {
                $groups[implode('|', [$schedule->day, $schedule->time, $student->teacher_id, $student->program_id])][] = $student->id;
            }
        });
        $index = 1;
        foreach ($groups as $key => $studentIds) {
            [$day, $time, $teacherId, $programId] = explode('|', $key);
            $session = ClassSession::create([
                'id' => 'CL'.str_pad((string) $index, 3, '0', STR_PAD_LEFT), 'day' => $day, 'time' => $time,
                'teacher_id' => $teacherId, 'program_id' => $programId, 'room' => 'Ruang '.(($index % 4) + 1),
                'capacity' => 8, 'is_active' => true,
            ]);
            $session->students()->sync($studentIds);
            $index++;
        }
    }
}
