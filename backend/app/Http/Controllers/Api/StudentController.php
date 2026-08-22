<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function index(Request $request)
    {
        $query = Student::query()->with(['program', 'teacher', 'schedules', 'statusHistories']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($builder) => $builder
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('parent_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%"));
        }
        foreach (['status', 'program_id', 'teacher_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        $perPage = min(100, max(1, $request->integer('per_page', 10)));

        return StudentResource::collection($query->orderBy('full_name')->paginate($perPage));
    }

    public function store(StudentRequest $request): JsonResponse
    {
        $student = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $schedules = $data['schedules'];
            unset($data['schedules'], $data['photo']);
            $data['id'] = $this->ids->next(Student::class, 'S', 3);
            $data['status'] = 'active';
            if ($request->hasFile('photo')) {
                $data['photo'] = $request->file('photo')->store('students', 'public');
            }
            $student = Student::create($data);
            $this->syncSchedules($student, $schedules);
            $student->statusHistories()->create([
                'date' => $student->join_date,
                'action' => 'activated',
                'changed_by' => $request->user()->id,
                'changed_by_name' => $request->user()->name,
            ]);

            return $student;
        });

        return (new StudentResource($student->load(['program', 'teacher', 'schedules', 'statusHistories'])))->response()->setStatusCode(201);
    }

    public function show(Student $student): StudentResource
    {
        return new StudentResource($student->load(['program', 'teacher', 'schedules', 'statusHistories', 'payments']));
    }

    public function update(StudentRequest $request, Student $student): StudentResource
    {
        DB::transaction(function () use ($request, $student) {
            $data = $request->validated();
            $schedules = $data['schedules'];
            unset($data['schedules'], $data['photo']);
            if ($request->hasFile('photo')) {
                if ($student->photo) {
                    Storage::disk('public')->delete($student->photo);
                }
                $data['photo'] = $request->file('photo')->store('students', 'public');
            }
            $student->update($data);
            $this->syncSchedules($student, $schedules);
        });

        return new StudentResource($student->fresh()->load(['program', 'teacher', 'schedules', 'statusHistories']));
    }

    public function deactivate(Request $request, Student $student): StudentResource
    {
        $data = $request->validate(['date' => ['required', 'date'], 'reason' => ['required', 'string', 'max:1000']]);
        abort_if($student->status === 'off', 422, 'Murid sudah berstatus Off.');

        DB::transaction(function () use ($request, $student, $data) {
            $student->update(['status' => 'off', 'leave_date' => $data['date']]);
            $student->classSessions()->detach();
            $student->statusHistories()->create([
                'date' => $data['date'], 'action' => 'deactivated', 'reason' => $data['reason'],
                'changed_by' => $request->user()->id, 'changed_by_name' => $request->user()->name,
            ]);
        });

        return new StudentResource($student->fresh()->load(['program', 'teacher', 'schedules', 'statusHistories']));
    }

    public function activate(Request $request, Student $student): StudentResource
    {
        $data = $request->validate(['date' => ['required', 'date'], 'reason' => ['nullable', 'string', 'max:1000']]);
        abort_if($student->status === 'active', 422, 'Murid sudah aktif.');

        DB::transaction(function () use ($request, $student, $data) {
            $student->update(['status' => 'active', 'leave_date' => null]);
            $student->statusHistories()->create([
                'date' => $data['date'], 'action' => 'activated', 'reason' => $data['reason'] ?? null,
                'changed_by' => $request->user()->id, 'changed_by_name' => $request->user()->name,
            ]);
        });

        return new StudentResource($student->fresh()->load(['program', 'teacher', 'schedules', 'statusHistories']));
    }

    public function destroy(Student $student): JsonResponse
    {
        abort_if($student->payments()->exists(), 409, 'Murid memiliki riwayat keuangan dan tidak dapat dihapus. Gunakan status Off.');
        if ($student->photo) {
            Storage::disk('public')->delete($student->photo);
        }
        $student->delete();

        return response()->json(['message' => 'Murid berhasil dihapus.']);
    }

    private function syncSchedules(Student $student, array $schedules): void
    {
        $student->schedules()->delete();
        foreach ($schedules as $schedule) {
            $student->schedules()->create([
                'day' => $schedule['day'],
                'time' => str_replace('.', ':', $schedule['time']),
            ]);
        }
    }
}
