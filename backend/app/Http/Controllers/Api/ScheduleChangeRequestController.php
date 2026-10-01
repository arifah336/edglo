<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScheduleChangeRequestResource;
use App\Models\ClassSession;
use App\Models\ScheduleChangeRequest;
use App\Models\Student;
use App\Services\IdGenerator;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ScheduleChangeRequestController extends Controller
{
    private const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    private const WEEKDAY_TIMES = ['11:00', '12:00', '13:30', '15:00', '16:30'];

    private const SATURDAY_TIMES = ['09:00', '10:30', '12:00', '13:30'];

    public function __construct(
        private readonly IdGenerator $ids,
        private readonly ScheduleService $schedules,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'studentId' => ['required', 'string', 'exists:students,id'],
            'currentSessionId' => ['nullable', 'string', 'exists:class_sessions,id'],
            'currentDay' => ['required_without:currentSessionId', 'nullable', Rule::in(self::DAYS)],
            'currentTime' => ['required_without:currentSessionId', 'nullable', 'regex:/^(?:[01]\d|2[0-3])[:.]([0-5]\d)$/'],
            'requestedDay' => ['required', Rule::in(self::DAYS)],
            'requestedTime' => ['required', 'regex:/^(?:[01]\d|2[0-3])[:.]([0-5]\d)$/'],
            'reason' => ['required', Rule::in(['school_conflict', 'family', 'transport', 'health', 'other'])],
            'details' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $student = Student::query()
            ->whereKey($data['studentId'])
            ->where('parent_user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();
        if (! $student) {
            throw ValidationException::withMessages(['studentId' => ['Murid tidak ditemukan pada akun orang tua ini atau sedang tidak aktif.']]);
        }

        $currentSession = isset($data['currentSessionId']) ? ClassSession::query()
            ->whereKey($data['currentSessionId'])
            ->where('is_active', true)
            ->whereHas('students', fn ($query) => $query->whereKey($student->id))
            ->first() : null;
        if (isset($data['currentSessionId']) && ! $currentSession) {
            throw ValidationException::withMessages(['currentSessionId' => ['Jadwal asal tidak terhubung dengan murid yang dipilih.']]);
        }

        $currentDay = $currentSession?->day ?? $data['currentDay'];
        $currentTime = $currentSession ? substr($currentSession->time, 0, 5) : str_replace('.', ':', $data['currentTime']);
        if (! $currentSession && ! $student->schedules()->where('day', $currentDay)->where('time', $currentTime)->exists()) {
            throw ValidationException::withMessages(['currentTime' => ['Jadwal asal tidak ditemukan pada data murid.']]);
        }

        $requestedTime = str_replace('.', ':', $data['requestedTime']);
        $allowedTimes = $data['requestedDay'] === 'Sabtu' ? self::SATURDAY_TIMES : self::WEEKDAY_TIMES;
        if (! in_array($requestedTime, $allowedTimes, true)) {
            throw ValidationException::withMessages(['requestedTime' => ['Jam yang dipilih tidak termasuk slot kelas EdGLO.']]);
        }
        if ($currentDay === $data['requestedDay'] && $currentTime === $requestedTime) {
            throw ValidationException::withMessages(['requestedTime' => ['Jadwal baru harus berbeda dari jadwal saat ini.']]);
        }

        $alreadyScheduled = $student->schedules()
            ->where('day', $data['requestedDay'])
            ->where('time', $requestedTime)
            ->exists();
        if ($alreadyScheduled) {
            throw ValidationException::withMessages(['requestedTime' => ['Murid sudah memiliki kelas pada hari dan jam tersebut.']]);
        }

        $hasPendingRequest = ScheduleChangeRequest::query()
            ->where('student_id', $student->id)
            ->when($currentSession, fn ($query) => $query->where('current_session_id', $currentSession->id))
            ->when(! $currentSession, fn ($query) => $query->whereNull('current_session_id')->where('current_day', $currentDay)->where('current_time', $currentTime))
            ->where('status', 'pending')
            ->exists();
        if ($hasPendingRequest) {
            throw ValidationException::withMessages(['currentSessionId' => ['Permintaan untuk jadwal ini masih menunggu keputusan Admin.']]);
        }

        $changeRequest = ScheduleChangeRequest::create([
            'id' => $this->ids->next(ScheduleChangeRequest::class, 'SCR', 4),
            'parent_user_id' => $request->user()->id,
            'student_id' => $student->id,
            'current_session_id' => $currentSession?->id,
            'current_day' => $currentDay,
            'current_time' => $currentTime,
            'requested_day' => $data['requestedDay'],
            'requested_time' => $requestedTime,
            'reason' => $data['reason'],
            'details' => trim($data['details']),
            'status' => 'pending',
        ]);

        return (new ScheduleChangeRequestResource($this->loadRelations($changeRequest)))
            ->response()
            ->setStatusCode(201);
    }

    public function approve(Request $request, ScheduleChangeRequest $scheduleChangeRequest): ScheduleChangeRequestResource
    {
        $data = $request->validate(['adminNotes' => ['nullable', 'string', 'max:1000']]);

        DB::transaction(function () use ($request, $scheduleChangeRequest, $data) {
            $changeRequest = ScheduleChangeRequest::query()->lockForUpdate()->findOrFail($scheduleChangeRequest->id);
            if ($changeRequest->status !== 'pending') {
                throw ValidationException::withMessages(['status' => ['Permintaan ini sudah pernah diproses.']]);
            }

            $student = Student::query()->lockForUpdate()->findOrFail($changeRequest->student_id);
            $source = $changeRequest->current_session_id
                ? ClassSession::query()->lockForUpdate()->find($changeRequest->current_session_id)
                : null;
            if ($changeRequest->current_session_id && (! $source || ! $source->is_active || ! $source->students()->whereKey($changeRequest->student_id)->exists())) {
                throw ValidationException::withMessages(['currentSessionId' => ['Jadwal asal murid sudah berubah. Periksa Jadwal Belajar sebelum memproses permintaan ini.']]);
            }
            if (! $source && ! $student->schedules()->where('day', $changeRequest->current_day)->where('time', $changeRequest->current_time)->exists()) {
                throw ValidationException::withMessages(['currentTime' => ['Jadwal asal murid sudah berubah. Periksa data murid sebelum memproses permintaan ini.']]);
            }
            if (! $source && ! $student->teacher_id) {
                throw ValidationException::withMessages(['teacherId' => ['Pengajar murid belum ditentukan. Atur pengajar terlebih dahulu pada Data Murid.']]);
            }

            $teacherId = $source?->teacher_id ?? $student->teacher_id;
            $programId = $source?->program_id ?? $student->program_id;

            $target = ClassSession::query()
                ->where('is_active', true)
                ->where('teacher_id', $teacherId)
                ->where('program_id', $programId)
                ->where('day', $changeRequest->requested_day)
                ->where('time', $changeRequest->requested_time)
                ->withCount('students')
                ->lockForUpdate()
                ->get()
                ->first(fn (ClassSession $session) => $session->students_count < $session->capacity);
            if (! $target) {
                throw ValidationException::withMessages([
                    'requestedTime' => ['Belum ada kelas aktif yang tersedia pada waktu pilihan dengan guru dan program yang sama. Buat slotnya di Jadwal Belajar terlebih dahulu.'],
                ]);
            }

            $hasConflict = ClassSession::query()
                ->when($source, fn ($query) => $query->whereKeyNot($source->id))
                ->where('day', $changeRequest->requested_day)
                ->where('time', $changeRequest->requested_time)
                ->whereHas('students', fn ($query) => $query->whereKey($changeRequest->student_id))
                ->exists();
            if ($hasConflict) {
                throw ValidationException::withMessages(['requestedTime' => ['Murid sudah memiliki kelas lain pada waktu pilihan.']]);
            }

            $source?->students()->detach($changeRequest->student_id);
            $target->students()->syncWithoutDetaching([$changeRequest->student_id]);
            if ($source) {
                $this->schedules->rebuildForStudents([$changeRequest->student_id]);
            } else {
                $student->schedules()->where('day', $changeRequest->current_day)->where('time', $changeRequest->current_time)->delete();
                $student->schedules()->firstOrCreate([
                    'day' => $changeRequest->requested_day,
                    'time' => $changeRequest->requested_time,
                ]);
            }
            $changeRequest->update([
                'target_session_id' => $target->id,
                'status' => 'approved',
                'admin_notes' => $data['adminNotes'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return new ScheduleChangeRequestResource($this->loadRelations($scheduleChangeRequest->fresh()));
    }

    public function reject(Request $request, ScheduleChangeRequest $scheduleChangeRequest): ScheduleChangeRequestResource
    {
        $data = $request->validate(['adminNotes' => ['required', 'string', 'min:5', 'max:1000']]);
        if ($scheduleChangeRequest->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ['Permintaan ini sudah pernah diproses.']]);
        }

        $scheduleChangeRequest->update([
            'status' => 'rejected',
            'admin_notes' => trim($data['adminNotes']),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return new ScheduleChangeRequestResource($this->loadRelations($scheduleChangeRequest->fresh()));
    }

    private function loadRelations(ScheduleChangeRequest $changeRequest): ScheduleChangeRequest
    {
        return $changeRequest->load(['parentUser', 'student.teacher', 'student.program', 'reviewer']);
    }
}
