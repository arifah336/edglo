<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ProgramResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\UserResource;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Program;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        Payment::where('status', 'pending')->whereDate('due_date', '<', today())->update(['status' => 'overdue']);

        $programs = Program::query()->orderBy('name')->get();
        $students = Student::query()
            ->with(['schedules', 'statusHistories'])
            ->orderBy('full_name')
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
            ? User::query()->orderByRaw("CASE role WHEN 'super_admin' THEN 0 ELSE 1 END")->orderBy('name')->get()
            : collect();

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
        ]]);
    }
}
