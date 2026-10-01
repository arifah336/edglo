<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherPayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacherId' => $this->teacher_id,
            'teacherName' => $this->whenLoaded('teacher', fn () => $this->teacher->full_name),
            'employmentType' => $this->whenLoaded('teacher', fn () => $this->teacher->employment_type),
            'month' => $this->month,
            'year' => $this->year,
            'attendanceCount' => $this->attendance_count,
            'ratePerSession' => $this->rate_per_session,
            'baseSalary' => $this->base_salary,
            'allowance' => $this->allowance,
            'deduction' => $this->deduction,
            'total' => $this->total,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
