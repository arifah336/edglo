<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentProgressLog;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeacherPortalController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $teacher = $this->teacherFor($request);
        $students = Student::query()
            ->with(['program', 'schedules', 'progressLogs' => fn ($query) => $query->limit(20)])
            ->withSum('progressLogs as total_progress_points', 'points')
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get();
        $dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $classes = $teacher->classSessions()
            ->with(['program', 'students' => fn ($query) => $query->where('status', 'active')->orderBy('full_name')])
            ->where('is_active', true)
            ->get()
            ->sortBy(fn ($session) => sprintf(
                '%02d-%s',
                array_search($session->day, $dayOrder, true) ?: 0,
                $session->time,
            ))
            ->values();

        return response()->json(['data' => [
            'teacher' => [
                'id' => $teacher->id,
                'fullName' => $teacher->full_name,
                'photo' => $teacher->photo ? '/storage/'.$teacher->photo : null,
                'employmentType' => $teacher->employment_type,
            ],
            'summary' => [
                'activeStudents' => $students->count(),
                'weeklySessions' => $classes->count(),
                'pointsThisMonth' => StudentProgressLog::query()
                    ->where('teacher_id', $teacher->id)
                    ->whereYear('activity_date', now()->year)
                    ->whereMonth('activity_date', now()->month)
                    ->sum('points'),
            ],
            'classes' => $classes->map(fn ($session) => [
                'id' => $session->id,
                'day' => $session->day,
                'time' => str_replace(':', '.', substr($session->time, 0, 5)),
                'room' => $session->room,
                'programName' => $session->program?->name ?? '-',
                'capacity' => $session->capacity,
                'notes' => $session->notes,
                'students' => $session->students->map(fn (Student $student) => [
                    'id' => $student->id,
                    'fullName' => $student->full_name,
                    'photo' => $student->photo ? '/storage/'.$student->photo : null,
                ])->values(),
            ])->values(),
            'students' => $students->map(fn (Student $student) => [
                'id' => $student->id,
                'fullName' => $student->full_name,
                'photo' => $student->photo ? '/storage/'.$student->photo : null,
                'programName' => $student->program?->name ?? '-',
                'currentLevel' => $student->current_level,
                'schedules' => $student->schedules->map(fn ($schedule) => [
                    'day' => $schedule->day,
                    'time' => str_replace(':', '.', substr($schedule->time, 0, 5)),
                ])->values(),
                'totalPoints' => (int) $student->total_progress_points,
                'progressLogs' => $student->progressLogs->map(fn (StudentProgressLog $log) => $this->progressData($log))->values(),
            ])->values(),
        ]]);
    }

    public function storeProgress(Request $request): JsonResponse
    {
        $teacher = $this->teacherFor($request);
        $data = $request->validate([
            'studentId' => ['required', 'exists:students,id'],
            'activityDate' => ['required', 'date'],
            'activityType' => ['required', Rule::in(['reading', 'practice', 'homework', 'achievement'])],
            'points' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        $student = Student::query()
            ->whereKey($data['studentId'])
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->firstOrFail();

        $log = StudentProgressLog::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'activity_date' => $data['activityDate'],
            'activity_type' => $data['activityType'],
            'points' => $data['points'],
            'notes' => $data['notes'] ?? null,
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->progressData($log)], 201);
    }

    public function destroyProgress(Request $request, StudentProgressLog $progressLog): JsonResponse
    {
        $teacher = $this->teacherFor($request);
        abort_unless($progressLog->teacher_id === $teacher->id, 403, 'Catatan ini bukan milik akun guru Anda.');
        $progressLog->delete();

        return response()->json(['message' => 'Catatan perkembangan berhasil dihapus.']);
    }

    private function teacherFor(Request $request): Teacher
    {
        return Teacher::query()->where('user_id', $request->user()->id)->where('status', 'active')->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function progressData(StudentProgressLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'studentId' => $log->student_id,
            'activityDate' => $log->activity_date->toDateString(),
            'activityType' => $log->activity_type,
            'points' => $log->points,
            'notes' => $log->notes,
        ];
    }
}
