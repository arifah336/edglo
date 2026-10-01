<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MakeUpScheduleResource;
use App\Models\ClassSession;
use App\Models\MakeUpSchedule;
use App\Models\StudentAbsence;
use App\Services\IdGenerator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MakeUpScheduleController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function index(Request $request)
    {
        $query = MakeUpSchedule::query()->with(['student', 'teacher', 'absence']);
        if ($request->filled('month')) {
            $query->whereMonth('scheduled_date', $request->integer('month'));
        }
        if ($request->filled('year')) {
            $query->whereYear('scheduled_date', $request->integer('year'));
        }

        return MakeUpScheduleResource::collection($query->orderBy('scheduled_date')->orderBy('time')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $absence = StudentAbsence::with('classSession')->findOrFail($data['studentAbsenceId']);
        abort_if($absence->makeUpSchedule()->exists(), 422, 'Jadwal pengganti untuk ketidakhadiran ini sudah tersedia.');
        $this->ensureTeacherAvailable($absence->classSession->teacher_id, $data['scheduledDate'], $data['time']);
        $schedule = MakeUpSchedule::create([
            'id' => $this->ids->next(MakeUpSchedule::class, 'MU', 4),
            'student_absence_id' => $absence->id,
            'student_id' => $absence->student_id,
            'teacher_id' => $absence->classSession->teacher_id,
            'original_session_id' => $absence->class_session_id,
            'scheduled_date' => $data['scheduledDate'],
            'time' => str_replace('.', ':', $data['time']),
            'room' => $data['room'],
            'status' => $data['status'] ?? 'scheduled',
            'notes' => $data['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);
        $absence->update(['status' => 'replacement_scheduled']);

        return (new MakeUpScheduleResource($schedule->load(['student', 'teacher'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, MakeUpSchedule $makeUpSchedule): MakeUpScheduleResource
    {
        $data = $this->validated($request);
        $this->ensureTeacherAvailable($makeUpSchedule->teacher_id, $data['scheduledDate'], $data['time'], $makeUpSchedule);
        $makeUpSchedule->update([
            'scheduled_date' => $data['scheduledDate'], 'time' => str_replace('.', ':', $data['time']),
            'room' => $data['room'], 'status' => $data['status'] ?? $makeUpSchedule->status,
            'notes' => $data['notes'] ?? null,
        ]);
        if ($makeUpSchedule->status === 'completed') {
            $makeUpSchedule->absence()->update(['status' => 'completed']);
        }

        return new MakeUpScheduleResource($makeUpSchedule->fresh()->load(['student', 'teacher']));
    }

    public function destroy(MakeUpSchedule $makeUpSchedule): JsonResponse
    {
        $makeUpSchedule->absence()->update(['status' => 'open']);
        $makeUpSchedule->delete();

        return response()->json(['message' => 'Jadwal pengganti berhasil dibatalkan.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'studentAbsenceId' => ['required', 'exists:student_absences,id'],
            'scheduledDate' => ['required', 'date'],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3])[:.]([0-5]\d)$/'],
            'room' => ['required', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    private function ensureTeacherAvailable(string $teacherId, string $date, string $time, ?MakeUpSchedule $current = null): void
    {
        $normalizedTime = str_replace('.', ':', $time);
        $days = [0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu'];
        $day = $days[Carbon::parse($date)->dayOfWeek];
        $regularConflict = ClassSession::where('teacher_id', $teacherId)->where('day', $day)->where('time', $normalizedTime)->where('is_active', true)->exists();
        $replacementConflict = MakeUpSchedule::where('teacher_id', $teacherId)->whereDate('scheduled_date', $date)->where('time', $normalizedTime)
            ->where('status', '!=', 'cancelled')->when($current, fn ($query) => $query->whereKeyNot($current->id))->exists();
        if ($regularConflict || $replacementConflict) {
            throw ValidationException::withMessages(['time' => ['Guru sudah memiliki kelas pada tanggal dan jam tersebut.']]);
        }
    }
}
