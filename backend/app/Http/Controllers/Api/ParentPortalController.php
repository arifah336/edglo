<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseRegistrationResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ScheduleChangeRequestResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\UserResource;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $students = Student::query()
            ->where('parent_user_id', $user->id)
            ->with(['program', 'teacher', 'schedules', 'statusHistories'])
            ->orderBy('full_name')
            ->get();
        $studentIds = $students->pluck('id');

        Payment::query()
            ->whereIn('student_id', $studentIds)
            ->where('status', 'pending')
            ->whereDate('due_date', '<', today())
            ->update(['status' => 'overdue']);

        $registrations = $user->courseRegistrations()
            ->with(['parentUser', 'program', 'reviewer'])
            ->latest()
            ->get();
        $sessions = ClassSession::query()
            ->where('is_active', true)
            ->whereHas('students', fn ($query) => $query->whereIn('students.id', $studentIds))
            ->with(['teacher', 'program', 'students:id'])
            ->orderBy('day')
            ->orderBy('time')
            ->get();
        $sessionRows = $sessions->map(fn (ClassSession $session) => [
            'id' => $session->id,
            'day' => $session->day,
            'time' => str_replace(':', '.', substr($session->time, 0, 5)),
            'teacherName' => $session->teacher->full_name,
            'programName' => $session->program->name,
            'room' => $session->room,
            'studentIds' => $session->students->pluck('id')->values(),
            'isClassSession' => true,
        ])->values();
        $coveredSchedules = $sessions->flatMap(fn (ClassSession $session) => $session->students->map(
            fn (Student $student) => $student->id.'|'.$session->day.'|'.substr($session->time, 0, 5),
        ))->flip();
        $manualScheduleRows = $students->flatMap(function (Student $student) use ($coveredSchedules) {
            return $student->schedules
                ->reject(fn ($schedule) => $coveredSchedules->has($student->id.'|'.$schedule->day.'|'.substr($schedule->time, 0, 5)))
                ->map(fn ($schedule) => [
                    'id' => 'student-schedule-'.$schedule->id,
                    'day' => $schedule->day,
                    'time' => str_replace(':', '.', substr($schedule->time, 0, 5)),
                    'teacherName' => $student->teacher?->full_name ?? 'Pengajar belum ditentukan',
                    'programName' => $student->program?->name ?? 'Program EdGLO',
                    'room' => 'Jadwal murid',
                    'studentIds' => [$student->id],
                    'isClassSession' => false,
                ]);
        })->values();
        $payments = Payment::query()
            ->whereIn('student_id', $studentIds)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
        $scheduleChangeRequests = $user->scheduleChangeRequests()
            ->with(['parentUser', 'student.teacher', 'student.program', 'reviewer'])
            ->latest()
            ->get();
        $programs = Program::query()->where('is_active', true)->orderBy('name')->get();

        return response()->json(['data' => [
            'user' => (new UserResource($user))->resolve($request),
            'registrations' => CourseRegistrationResource::collection($registrations)->resolve($request),
            'students' => StudentResource::collection($students)->resolve($request),
            'sessions' => $sessionRows->concat($manualScheduleRows)->values(),
            'payments' => PaymentResource::collection($payments)->resolve($request),
            'programs' => \App\Http\Resources\ProgramResource::collection($programs)->resolve($request),
            'scheduleChangeRequests' => ScheduleChangeRequestResource::collection($scheduleChangeRequests)->resolve($request),
        ]]);
    }
}
