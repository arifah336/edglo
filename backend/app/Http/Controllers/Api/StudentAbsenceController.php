<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentAbsenceResource;
use App\Models\ClassSession;
use App\Models\StudentAbsence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentAbsenceController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentAbsence::query()->with(['student', 'classSession.teacher', 'makeUpSchedule.student', 'makeUpSchedule.teacher']);
        if ($request->filled('month')) {
            $query->whereMonth('absence_date', $request->integer('month'));
        }
        if ($request->filled('year')) {
            $query->whereYear('absence_date', $request->integer('year'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return StudentAbsenceResource::collection($query->orderByDesc('absence_date')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'studentId' => ['required', 'exists:students,id'],
            'classSessionId' => ['required', 'exists:class_sessions,id'],
            'absenceDate' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);
        $session = ClassSession::with('students:id')->findOrFail($data['classSessionId']);
        if (! $session->students->contains('id', $data['studentId'])) {
            throw ValidationException::withMessages(['studentId' => ['Murid tidak terdaftar pada sesi yang dipilih.']]);
        }
        $absence = StudentAbsence::updateOrCreate(
            ['student_id' => $data['studentId'], 'class_session_id' => $data['classSessionId'], 'absence_date' => $data['absenceDate']],
            ['reason' => $data['reason'] ?? null, 'status' => 'open', 'recorded_by' => $request->user()->id],
        );

        return (new StudentAbsenceResource($absence->load(['student', 'classSession.teacher', 'makeUpSchedule'])))->response()->setStatusCode($absence->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(StudentAbsence $studentAbsence): JsonResponse
    {
        $studentAbsence->delete();

        return response()->json(['message' => 'Ketidakhadiran murid berhasil dihapus.']);
    }
}
