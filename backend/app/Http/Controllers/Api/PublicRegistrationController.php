<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseRegistrationResource;
use App\Models\ClassSession;
use App\Models\CourseRegistration;
use App\Models\Program;
use App\Services\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PublicRegistrationController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'parentName' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:30'],
            'childName' => ['required', 'string', 'max:150'],
            'childAge' => ['required', 'integer', 'between:3,18'],
            'address' => ['required', 'string', 'max:1000'],
            'programSelections' => ['required', 'array', 'min:1', 'max:3'],
            'programSelections.*.programId' => ['required', 'string', 'distinct', 'exists:programs,id'],
            'programSelections.*.months' => ['required', 'integer', 'between:1,12'],
            'preferredSchedules' => ['required', 'array', 'min:1', 'max:6'],
            'preferredSchedules.*.day' => ['required', 'string', 'distinct', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
            'preferredSchedules.*.time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d$/'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $programIds = collect($data['programSelections'])->pluck('programId');
        $programs = Program::query()->whereIn('id', $programIds)->where('is_active', true)->get()->keyBy('id');
        if ($programs->count() !== $programIds->count()) {
            throw ValidationException::withMessages(['programSelections' => ['Salah satu program yang dipilih sudah tidak tersedia.']]);
        }

        $availableSlots = ClassSession::query()
            ->where('is_active', true)
            ->get(['day', 'time'])
            ->mapWithKeys(fn (ClassSession $session) => [
                $session->day.'|'.substr(str_replace('.', ':', $session->time), 0, 5) => true,
            ]);
        $invalidSchedule = collect($data['preferredSchedules'])->first(
            fn (array $schedule) => ! $availableSlots->has($schedule['day'].'|'.$schedule['time'])
        );
        if ($invalidSchedule) {
            throw ValidationException::withMessages([
                'preferredSchedules' => ["Slot {$invalidSchedule['day']} pukul {$invalidSchedule['time']} sudah tidak tersedia. Pilih jadwal terbaru."],
            ]);
        }

        $selections = collect($data['programSelections'])->map(function (array $selection) use ($programs) {
            $program = $programs->get($selection['programId']);
            $months = (int) $selection['months'];
            $subtotal = (int) $program->price * $months;
            $discountPercent = $months >= (int) $program->discount_min_months
                ? (int) $program->discount_percent
                : 0;
            $discountAmount = (int) round($subtotal * $discountPercent / 100);

            return [
                'programId' => $program->id,
                'programName' => $program->name,
                'months' => $months,
                'sessionsPerWeek' => (int) $program->sessions_per_week,
                'monthlyPrice' => (int) $program->price,
                'billingCycleMonths' => (int) $program->billing_cycle_months,
                'discountPercent' => $discountPercent,
                'discountAmount' => $discountAmount,
                'packageTotal' => $subtotal - $discountAmount,
                'registrationFee' => (int) $program->registration_fee,
                'bookFee' => (int) $program->book_fee,
            ];
        })->values();

        $registration = DB::transaction(function () use ($data, $selections) {
            $duplicate = CourseRegistration::query()
                ->where('parent_phone', $data['phone'])
                ->where('child_name', $data['childName'])
                ->where('status', 'pending')
                ->exists();
            if ($duplicate) {
                throw ValidationException::withMessages(['childName' => ['Pendaftaran anak ini masih menunggu pemeriksaan Admin.']]);
            }

            $preferredSchedules = collect($data['preferredSchedules'])->map(fn (array $schedule) => [
                'day' => $schedule['day'],
                'time' => $schedule['time'],
            ])->values();
            $times = $preferredSchedules->pluck('time')->unique();

            return CourseRegistration::create([
                'id' => $this->ids->next(CourseRegistration::class, 'R', 4),
                'parent_user_id' => null,
                'parent_name' => trim($data['parentName']),
                'parent_email' => isset($data['email']) ? strtolower(trim($data['email'])) : null,
                'parent_phone' => trim($data['phone']),
                'program_id' => $selections->first()['programId'],
                'program_selections' => $selections->all(),
                'child_name' => trim($data['childName']),
                'child_age' => $data['childAge'],
                'address' => trim($data['address']),
                'preferred_days' => $preferredSchedules->pluck('day')->all(),
                'preferred_time' => $times->count() === 1 ? $times->first() : null,
                'preferred_schedules' => $preferredSchedules->all(),
                'notes' => isset($data['notes']) ? trim($data['notes']) : null,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim dan menunggu pemeriksaan Admin.',
            'registration' => (new CourseRegistrationResource($registration->load('program')))->resolve($request),
        ], 201);
    }
}
