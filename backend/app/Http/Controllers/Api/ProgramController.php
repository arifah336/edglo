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
        if (! $request->has('sessions_per_week') && $request->has('sessionsPerWeek')) {
            $request->merge(['sessions_per_week' => $request->input('sessionsPerWeek')]);
        }
        if (! $request->has('is_active') && $request->has('isActive')) {
            $request->merge(['is_active' => $request->input('isActive')]);
        }

        return $request->validate([
            'id' => [$program ? 'sometimes' : 'required', 'string', 'max:60', Rule::unique('programs', 'id')->ignore($program?->id, 'id')],
            'name' => ['required', 'string', 'max:150', Rule::unique('programs', 'name')->ignore($program?->id, 'id')],
            'price' => ['required', 'integer', 'min:0'],
            'sessions_per_week' => ['required', 'integer', 'between:1,6'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
