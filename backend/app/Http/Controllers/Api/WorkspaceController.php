<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseRegistrationResource;
use App\Http\Resources\MakeUpScheduleResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ProgramResource;
use App\Http\Resources\ScheduleChangeRequestResource;
use App\Http\Resources\StudentAbsenceResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\TeacherAttendanceResource;
use App\Http\Resources\TeacherPayrollResource;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\UserResource;
use App\Models\ClassSession;
use App\Models\CourseRegistration;
use App\Models\MakeUpSchedule;
use App\Models\Payment;
use App\Models\Program;
use App\Models\ScheduleChangeRequest;
use App\Models\Student;
use App\Models\StudentAbsence;
use App\Models\Teacher;
use App\Models\TeacherAttendance;
use App\Models\TeacherPayroll;
use App\Models\User;
use App\Services\PackageExpiryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function __construct(private readonly PackageExpiryService $packageExpiry) {}

    public function __invoke(Request $request): JsonResponse
    {
        $this->packageExpiry->deactivateExpiredStudents();
        Payment::where('status', 'pending')->whereDate('due_date', '<', today())->update(['status' => 'overdue']);

        $programs = Program::query()->orderBy('name')->get();
        $students = Student::query()
            ->with(['schedules', 'statusHistories'])
            ->orderBy('id')
            ->get();
        $teachers = Teacher::query()
            ->with('statusHistories')
            ->withCount(['students' => fn ($query) => $query->where('status', 'active')])
            ->orderBy('full_name')
            ->get();
        $sessions = ClassSession::query()
            ->with('students:id')
            ->orderBy('day')
            ->orderBy('time')
            ->get();
        $payments = Payment::query()
            ->orderByDesc('due_date')
            ->get();
        $admins = $request->user()->role === 'super_admin'
            ? User::query()->whereIn('role', ['super_admin', 'admin'])->orderByRaw("CASE role WHEN 'super_admin' THEN 0 ELSE 1 END")->orderBy('name')->get()
            : collect();
        $registrations = CourseRegistration::query()
            ->with(['parentUser', 'program', 'reviewer'])
            ->latest()
            ->get();
        $teacherAttendances = TeacherAttendance::query()->with(['teacher', 'classSession', 'recorder'])->latest('attendance_date')->limit(300)->get();
        $studentAbsences = StudentAbsence::query()->with(['student', 'classSession.teacher', 'makeUpSchedule.student', 'makeUpSchedule.teacher'])->latest('absence_date')->limit(300)->get();
        $makeUpSchedules = MakeUpSchedule::query()->with(['student', 'teacher'])->latest('scheduled_date')->limit(300)->get();
        $teacherPayrolls = $request->user()->role === 'super_admin'
            ? TeacherPayroll::query()->with('teacher')->latest('year')->latest('month')->get()
            : collect();
        $scheduleChangeRequests = ScheduleChangeRequest::query()
            ->with(['parentUser', 'student.teacher', 'student.program', 'reviewer'])
            ->latest()
            ->limit(300)
            ->get();

        return response()->json(['data' => [
            'user' => (new UserResource($request->user()))->resolve($request),
            'programs' => ProgramResource::collection($programs)->resolve($request),
            'students' => StudentResource::collection($students)->resolve($request),
            'teachers' => TeacherResource::collection($teachers)->resolve($request),
            'sessions' => $sessions->map(fn (ClassSession $session) => [
                'id' => $session->id,
                'day' => $session->day,
                'time' => str_replace(':', '.', substr($session->time, 0, 5)),
                'teacherId' => $session->teacher_id,
                'programId' => $session->program_id,
                'studentIds' => $session->students->pluck('id')->values(),
                'room' => $session->room,
                'capacity' => $session->capacity,
                'isActive' => $session->is_active,
                'notes' => $session->notes,
            ])->values(),
            'payments' => PaymentResource::collection($payments)->resolve($request),
            'admins' => UserResource::collection($admins)->resolve($request),
            'registrations' => CourseRegistrationResource::collection($registrations)->resolve($request),
            'teacherAttendances' => TeacherAttendanceResource::collection($teacherAttendances)->resolve($request),
            'studentAbsences' => StudentAbsenceResource::collection($studentAbsences)->resolve($request),
            'makeUpSchedules' => MakeUpScheduleResource::collection($makeUpSchedules)->resolve($request),
            'teacherPayrolls' => TeacherPayrollResource::collection($teacherPayrolls)->resolve($request),
            'scheduleChangeRequests' => ScheduleChangeRequestResource::collection($scheduleChangeRequests)->resolve($request),
        ]]);
    }
}
