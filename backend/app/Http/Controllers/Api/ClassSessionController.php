<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassSessionRequest;
use App\Http\Resources\ClassSessionResource;
use App\Models\ClassSession;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\IdGenerator;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClassSessionController extends Controller
{
    public function __construct(
        private readonly IdGenerator $ids,
        private readonly ScheduleService $schedules,
    ) {}

    public function index(Request $request)
    {
        $query = ClassSession::query()->with(['teacher', 'program', 'students.program', 'students.teacher', 'students.schedules']);
        foreach (['day', 'teacher_id', 'program_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min(100, max(1, $request->integer('per_page', 10)));

        return ClassSessionResource::collection($query->orderBy('day')->orderBy('time')->paginate($perPage));
    }

    public function store(ClassSessionRequest $request): JsonResponse
    {
        $data = $this->normalize($request->validated());
        $this->validateBusinessRules($data);

        $session = DB::transaction(function () use ($data) {
            $studentIds = $data['student_ids'];
            unset($data['student_ids']);
            $data['id'] = $this->ids->next(ClassSession::class, 'CL', 3);
            $session = ClassSession::create($data);
            $session->students()->sync($studentIds);
            $this->schedules->rebuildForStudents($studentIds);

            return $session;
        });

        return (new ClassSessionResource($session->load(['teacher', 'program', 'students.program', 'students.teacher', 'students.schedules'])))->response()->setStatusCode(201);
    }

    public function show(ClassSession $classSession): ClassSessionResource
    {
        return new ClassSessionResource($classSession->load(['teacher', 'program', 'students.program', 'students.teacher', 'students.schedules']));
    }

    public function update(ClassSessionRequest $request, ClassSession $classSession): ClassSessionResource
    {
        $data = $this->normalize($request->validated());
        $this->validateBusinessRules($data, $classSession);
        $oldStudentIds = $classSession->students()->pluck('students.id')->all();

        DB::transaction(function () use ($data, $classSession, $oldStudentIds) {
            $studentIds = $data['student_ids'];
            unset($data['student_ids']);
            $classSession->update($data);
            $classSession->students()->sync($studentIds);
            $this->schedules->rebuildForStudents(array_merge($oldStudentIds, $studentIds));
        });

        return new ClassSessionResource($classSession->fresh()->load(['teacher', 'program', 'students.program', 'students.teacher', 'students.schedules']));
    }

    public function destroy(ClassSession $classSession): JsonResponse
    {
        $studentIds = $classSession->students()->pluck('students.id')->all();
        DB::transaction(function () use ($classSession, $studentIds) {
            $classSession->students()->detach();
            $classSession->delete();
            $this->schedules->rebuildForStudents($studentIds);
        });

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }

    private function normalize(array $data): array
    {
        $data['time'] = str_replace('.', ':', $data['time']);
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }

    private function validateBusinessRules(array $data, ?ClassSession $current = null): void
    {
        $teacher = Teacher::findOrFail($data['teacher_id']);
        if ($teacher->status !== 'active') {
            throw ValidationException::withMessages(['teacher_id' => ['Guru berstatus Off dan tidak dapat dijadwalkan.']]);
        }
        if (count($data['student_ids']) > $data['capacity']) {
            throw ValidationException::withMessages(['student_ids' => ['Jumlah murid melebihi kapasitas kelas.']]);
        }

        $students = Student::whereIn('id', $data['student_ids'])->get();
        $invalid = $students->first(fn (Student $student) => $student->status !== 'active' || $student->program_id !== $data['program_id']);
        if ($invalid) {
            throw ValidationException::withMessages(['student_ids' => ["{$invalid->full_name} tidak aktif atau programnya tidak sesuai kelas."]]);
        }

        $teacherConflict = ClassSession::query()
            ->where('day', $data['day'])->where('time', $data['time'])->where('teacher_id', $data['teacher_id'])
            ->when($current, fn ($query) => $query->whereKeyNot($current->id))->exists();
        if ($teacherConflict) {
            throw ValidationException::withMessages(['time' => ['Guru sudah memiliki kelas pada hari dan jam tersebut.']]);
        }

        $studentConflict = ClassSession::query()
            ->where('day', $data['day'])->where('time', $data['time'])
            ->when($current, fn ($query) => $query->whereKeyNot($current->id))
            ->whereHas('students', fn ($query) => $query->whereIn('students.id', $data['student_ids']))
            ->exists();
        if ($studentConflict) {
            throw ValidationException::withMessages(['student_ids' => ['Salah satu murid sudah memiliki kelas pada jadwal tersebut.']]);
        }
    }
}
