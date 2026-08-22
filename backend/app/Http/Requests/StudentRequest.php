<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $map = [
            'full_name' => 'fullName', 'parent_name' => 'parentName', 'program_id' => 'programId',
            'sessions_per_week' => 'sessionsPerWeek', 'join_date' => 'joinDate',
            'leave_date' => 'leaveDate', 'teacher_id' => 'teacherId',
        ];
        foreach ($map as $snake => $camel) {
            if (! $this->has($snake) && $this->has($camel)) {
                $this->merge([$snake => $this->input($camel)]);
            }
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:150'],
            'parent_name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:1000'],
            'phone' => ['required', 'string', 'max:30'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'program_id' => ['required', 'exists:programs,id'],
            'sessions_per_week' => ['required', 'integer', 'between:1,6'],
            'join_date' => ['required', 'date'],
            'leave_date' => ['nullable', 'date', 'after_or_equal:join_date'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'schedules' => ['present', 'array', 'max:6'],
            'schedules.*.day' => ['required', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
            'schedules.*.time' => ['required', 'regex:/^(?:[01]\d|2[0-3])[:.]([0-5]\d)$/'],
        ];
    }
}
