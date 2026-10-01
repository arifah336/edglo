<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherPayrollResource;
use App\Models\Teacher;
use App\Models\TeacherAttendance;
use App\Models\TeacherPayroll;
use App\Services\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeacherPayrollController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function index(Request $request)
    {
        $query = TeacherPayroll::query()->with('teacher');
        if ($request->filled('month')) {
            $query->where('month', $request->integer('month'));
        }
        if ($request->filled('year')) {
            $query->where('year', $request->integer('year'));
        }

        return TeacherPayrollResource::collection($query->orderBy('teacher_id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        Teacher::findOrFail($data['teacherId']);
        $attendanceCount = TeacherAttendance::where('teacher_id', $data['teacherId'])
            ->where('status', 'present')->whereMonth('attendance_date', $data['month'])
            ->whereYear('attendance_date', $data['year'])->count();
        $baseSalary = (int) ($data['baseSalary'] ?? 0);
        $rate = (int) $data['ratePerSession'];
        $allowance = (int) ($data['allowance'] ?? 0);
        $deduction = (int) ($data['deduction'] ?? 0);
        $values = [
            'attendance_count' => $attendanceCount, 'rate_per_session' => $rate,
            'base_salary' => $baseSalary, 'allowance' => $allowance, 'deduction' => $deduction,
            'total' => max(0, $baseSalary + ($attendanceCount * $rate) + $allowance - $deduction),
            'status' => $data['status'] ?? 'draft', 'notes' => $data['notes'] ?? null,
            'created_by' => $request->user()->id,
        ];
        $payroll = TeacherPayroll::where('teacher_id', $data['teacherId'])->where('month', $data['month'])->where('year', $data['year'])->first();
        if ($payroll) {
            $payroll->update($values);
        } else {
            $payroll = TeacherPayroll::create(['id' => $this->ids->next(TeacherPayroll::class, 'SLIP', 4), 'teacher_id' => $data['teacherId'], 'month' => $data['month'], 'year' => $data['year'], ...$values]);
        }

        return (new TeacherPayrollResource($payroll->load('teacher')))->response()->setStatusCode($payroll->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(TeacherPayroll $teacherPayroll): JsonResponse
    {
        abort_if($teacherPayroll->status === 'paid', 409, 'Slip yang sudah dibayar tidak dapat dihapus.');
        $teacherPayroll->delete();

        return response()->json(['message' => 'Slip gaji berhasil dihapus.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'teacherId' => ['required', 'exists:teachers,id'],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2020,2100'],
            'ratePerSession' => ['required', 'integer', 'min:0'],
            'baseSalary' => ['nullable', 'integer', 'min:0'],
            'allowance' => ['nullable', 'integer', 'min:0'],
            'deduction' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['draft', 'final', 'paid'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
