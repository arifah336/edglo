<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    public function publicIndex()
    {
        return ProgramResource::collection(
            Program::query()->where('is_active', true)->orderBy('name')->get()
        );
    }

    public function index(Request $request)
    {
        $query = Program::query()->withCount(['activeStudents']);
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return ProgramResource::collection($query->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $program = Program::create($this->validated($request));

        return (new ProgramResource($program))->response()->setStatusCode(201);
    }

    public function show(Program $program): ProgramResource
    {
        return new ProgramResource($program->loadCount('activeStudents'));
    }

    public function update(Request $request, Program $program): ProgramResource
    {
        $program->update($this->validated($request, $program));

        return new ProgramResource($program->fresh()->loadCount('activeStudents'));
    }

    public function destroy(Program $program): JsonResponse
    {
        abort_if($program->students()->exists(), 409, 'Program masih digunakan oleh murid. Nonaktifkan program sebagai gantinya.');
        $program->delete();

        return response()->json(['message' => 'Program berhasil dihapus.']);
    }

    private function validated(Request $request, ?Program $program = null): array
    {
        $camelCaseFields = [
            'targetAge' => 'target_age',
            'sessionsPerWeek' => 'sessions_per_week',
            'defaultPackageMonths' => 'default_package_months',
            'billingCycleMonths' => 'billing_cycle_months',
            'registrationFee' => 'registration_fee',
            'bookFee' => 'book_fee',
            'discountPercent' => 'discount_percent',
            'discountMinMonths' => 'discount_min_months',
            'levelOptions' => 'level_options',
            'levelDurationMonths' => 'level_duration_months',
            'isActive' => 'is_active',
        ];
        foreach ($camelCaseFields as $input => $column) {
            if (! $request->has($column) && $request->has($input)) {
                $request->merge([$column => $request->input($input)]);
            }
        }

        return $request->validate([
            'id' => [$program ? 'sometimes' : 'required', 'string', 'max:60', Rule::unique('programs', 'id')->ignore($program?->id, 'id')],
            'name' => ['required', 'string', 'max:150', Rule::unique('programs', 'name')->ignore($program?->id, 'id')],
            'description' => ['nullable', 'string', 'max:1000'],
            'target_age' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'integer', 'min:0'],
            'sessions_per_week' => ['required', 'integer', 'between:1,6'],
            'default_package_months' => ['sometimes', 'integer', 'between:1,12'],
            'billing_cycle_months' => ['sometimes', 'integer', 'between:1,12'],
            'registration_fee' => ['sometimes', 'integer', 'min:0'],
            'book_fee' => ['sometimes', 'integer', 'min:0'],
            'discount_percent' => ['sometimes', 'integer', 'between:0,100'],
            'discount_min_months' => ['sometimes', 'integer', 'between:1,12'],
            'level_options' => ['nullable', 'array', 'max:12'],
            'level_options.*' => ['string', 'max:30', 'distinct'],
            'level_duration_months' => ['nullable', 'integer', 'between:1,24'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
