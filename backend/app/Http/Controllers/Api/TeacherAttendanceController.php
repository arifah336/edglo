<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherAttendanceResource;
use App\Models\ClassSession;
use App\Models\TeacherAttendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TeacherAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = TeacherAttendance::query()->with(['teacher', 'classSession', 'recorder']);
        if ($request->filled('month')) {
            $query->whereMonth('attendance_date', $request->integer('month'));
        }
        if ($request->filled('year')) {
            $query->whereYear('attendance_date', $request->integer('year'));
        }
        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        return TeacherAttendanceResource::collection($query->orderByDesc('attendance_date')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'teacherId' => ['required', 'exists:teachers,id'],
            'classSessionId' => ['required', 'exists:class_sessions,id'],
            'attendanceDate' => ['required', 'date'],
            'status' => ['required', Rule::in(['present', 'absent', 'excused'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        $session = ClassSession::findOrFail($data['classSessionId']);
        if ($session->teacher_id !== $data['teacherId']) {
            throw ValidationException::withMessages(['teacherId' => ['Guru tidak sesuai dengan sesi yang dipilih.']]);
        }
        $attendance = TeacherAttendance::updateOrCreate(
            ['teacher_id' => $data['teacherId'], 'class_session_id' => $data['classSessionId'], 'attendance_date' => $data['attendanceDate']],
            ['status' => $data['status'], 'notes' => $data['notes'] ?? null, 'recorded_by' => $request->user()->id],
        );

        return (new TeacherAttendanceResource($attendance->load(['teacher', 'classSession', 'recorder'])))->response()->setStatusCode($attendance->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(TeacherAttendance $teacherAttendance): JsonResponse
    {
        $teacherAttendance->delete();

        return response()->json(['message' => 'Absensi guru berhasil dihapus.']);
    }
}
