<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseRegistrationResource;
use App\Http\Resources\UserResource;
use App\Models\CourseRegistration;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Services\IdGenerator;
use App\Services\ProgramLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CourseRegistrationController extends Controller
{
    public function __construct(
        private readonly IdGenerator $ids,
        private readonly ProgramLevelService $programLevels,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'parentName' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
            'childName' => ['required', 'string', 'max:150'],
            'childAge' => ['required', 'integer', 'between:3,18'],
            'address' => ['required', 'string', 'max:1000'],
            'programId' => ['required', 'exists:programs,id'],
            'preferredDays' => ['nullable', 'array', 'max:6'],
            'preferredDays.*' => ['string', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
            'preferredTime' => ['nullable', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d$/'],
            'preferredSchedules' => ['nullable', 'array', 'max:6'],
            'preferredSchedules.*.day' => ['required', 'string', 'distinct', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
            'preferredSchedules.*.time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d$/'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $preferredSchedules = collect($data['preferredSchedules'] ?? [])->map(fn (array $schedule) => [
            'day' => $schedule['day'],
            'time' => $schedule['time'],
        ])->values();

        if ($preferredSchedules->isEmpty()) {
            $preferredSchedules = collect($data['preferredDays'] ?? [])->map(fn (string $day) => [
                'day' => $day,
                'time' => $data['preferredTime'] ?? null,
            ])->values();
        }

        if ($preferredSchedules->isEmpty()) {
            throw ValidationException::withMessages([
                'preferredSchedules' => ['Pilih minimal satu hari dan jam yang tersedia.'],
            ]);
        }
        if ($preferredSchedules->contains(fn (array $schedule) => empty($schedule['time']))) {
            throw ValidationException::withMessages([
                'preferredSchedules' => ['Lengkapi jam untuk setiap hari yang dipilih.'],
            ]);
        }

        $program = Program::query()->findOrFail($data['programId']);
        $requiredDays = (int) $program->sessions_per_week;
        if ($preferredSchedules->count() > $requiredDays) {
            throw ValidationException::withMessages([
                'preferredSchedules' => ["Program {$program->name} menerima maksimal {$requiredDays} pilihan hari."],
            ]);
        }

        $preferredTimes = $preferredSchedules->pluck('time')->filter()->unique()->values();
        $data['preferredSchedules'] = $preferredSchedules->all();
        $data['preferredDays'] = $preferredSchedules->pluck('day')->all();
        $data['preferredTime'] = $preferredTimes->count() === 1 ? $preferredTimes->first() : null;

        [$parent, $registration] = DB::transaction(function () use ($data) {
            $email = strtolower($data['email']);
            $parent = User::query()->where('email', $email)->first();

            if ($parent && ($parent->role !== 'parent' || ! $parent->is_active || ! Hash::check($data['password'], $parent->password))) {
                throw ValidationException::withMessages([
                    'email' => ['Email sudah digunakan atau password akun orang tua tidak sesuai.'],
                ]);
            }

            if (! $parent) {
                $parent = User::create([
                    'code' => $this->ids->next(User::class, 'P', 3, 'code'),
                    'name' => $data['parentName'],
                    'email' => $email,
                    'phone' => $data['phone'],
                    'role' => 'parent',
                    'is_active' => true,
                    'password' => $data['password'],
                ]);
            } else {
                $parent->update([
                    'name' => $data['parentName'],
                    'phone' => $data['phone'],
                ]);
            }

            $duplicate = CourseRegistration::query()
                ->where('parent_user_id', $parent->id)
                ->where('child_name', $data['childName'])
                ->where('status', 'pending')
                ->exists();
            if ($duplicate) {
                throw ValidationException::withMessages([
                    'childName' => ['Pendaftaran anak ini masih menunggu pemeriksaan admin.'],
                ]);
            }

            $registration = CourseRegistration::create([
                'id' => $this->ids->next(CourseRegistration::class, 'R', 4),
                'parent_user_id' => $parent->id,
                'program_id' => $data['programId'],
                'child_name' => $data['childName'],
                'child_age' => $data['childAge'],
                'address' => $data['address'],
                'preferred_days' => $data['preferredDays'] ?? [],
                'preferred_time' => $data['preferredTime'] ?? null,
                'preferred_schedules' => $data['preferredSchedules'],
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
            ]);

            return [$parent, $registration];
        });

        $token = $parent->createToken('edglo-parent-registration')->plainTextToken;

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim.',
            'token' => $token,
            'tokenType' => 'Bearer',
            'user' => (new UserResource($parent))->resolve($request),
            'registration' => (new CourseRegistrationResource($registration->load(['parentUser', 'program'])))->resolve($request),
        ], 201);
    }

    public function index(Request $request)
    {
        $query = CourseRegistration::query()->with(['parentUser', 'program', 'reviewer'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($builder) => $builder
                ->where('child_name', 'like', "%{$search}%")
                ->orWhere('parent_name', 'like', "%{$search}%")
                ->orWhere('parent_phone', 'like', "%{$search}%")
                ->orWhereHas('parentUser', fn ($parent) => $parent
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")));
        }

        return CourseRegistrationResource::collection($query->paginate(min(100, max(1, $request->integer('per_page', 10)))));
    }

    public function approve(Request $request, CourseRegistration $registration): CourseRegistrationResource
    {
        abort_if($registration->status !== 'pending', 422, 'Pendaftaran ini sudah diproses.');
        $data = $request->validate([
            'joinDate' => ['nullable', 'date'],
            'adminNotes' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $registration, $data) {
            $program = Program::findOrFail($registration->program_id);
            $joinDate = $data['joinDate'] ?? today()->toDateString();
            $levelDefaults = $this->programLevels->defaultsFor($program->id);
            $programSelections = collect($registration->program_selections ?: [[
                'programId' => $program->id,
                'programName' => $program->name,
                'months' => 1,
                'sessionsPerWeek' => $program->sessions_per_week,
                'monthlyPrice' => $program->price,
            ]]);
            $longestPackage = max(1, (int) $programSelections->max('months'));
            $packageEnd = \Illuminate\Support\Carbon::parse($joinDate)->addMonthsNoOverflow($longestPackage)->subDay()->toDateString();
            $student = Student::create([
                'id' => $this->ids->next(Student::class, 'S', 3),
                'parent_user_id' => $registration->parent_user_id,
                'full_name' => $registration->child_name,
                'parent_name' => $registration->parent_name ?? $registration->parentUser?->name,
                'address' => $registration->address,
                'phone' => $registration->parent_phone ?? $registration->parentUser?->phone,
                'program_id' => $program->id,
                'sessions_per_week' => $program->sessions_per_week,
                'package_started_at' => $joinDate,
                'package_ends_at' => $packageEnd,
                'package_selections' => $programSelections->all(),
                'join_date' => $joinDate,
                'current_level' => $levelDefaults['current_level'],
                'level_started_at' => $joinDate,
                'level_duration_months' => $levelDefaults['level_duration_months'],
                'notes' => $registration->notes,
                'status' => 'active',
            ]);
            $student->statusHistories()->create([
                'date' => $student->join_date,
                'action' => 'activated',
                'reason' => 'Disetujui dari pendaftaran online.',
                'changed_by' => $request->user()->id,
                'changed_by_name' => $request->user()->name,
            ]);
            $registration->update([
                'student_id' => $student->id,
                'status' => 'approved',
                'admin_notes' => $data['adminNotes'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return new CourseRegistrationResource($registration->fresh()->load(['parentUser', 'program', 'reviewer']));
    }

    public function reject(Request $request, CourseRegistration $registration): CourseRegistrationResource
    {
        abort_if($registration->status !== 'pending', 422, 'Pendaftaran ini sudah diproses.');
        $data = $request->validate(['adminNotes' => ['required', 'string', 'max:2000']]);
        $registration->update([
            'status' => 'rejected',
            'admin_notes' => $data['adminNotes'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return new CourseRegistrationResource($registration->fresh()->load(['parentUser', 'program', 'reviewer']));
    }
}
