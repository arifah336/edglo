<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $map = [
            'full_name' => 'fullName', 'birth_place' => 'birthPlace', 'birth_date' => 'birthDate',
            'parent_name' => 'parentName', 'program_id' => 'programId', 'current_level' => 'currentLevel',
            'level_started_at' => 'levelStartedAt', 'level_duration_months' => 'levelDurationMonths',
            'sessions_per_week' => 'sessionsPerWeek', 'join_date' => 'joinDate',
            'package_started_at' => 'packageStartedAt', 'package_ends_at' => 'packageEndsAt',
            'leave_date' => 'leaveDate', 'teacher_id' => 'teacherId', 'registration_fee' => 'registrationFee',
            'book_fee' => 'bookFee', 'other_fee' => 'otherFee', 'fee_notes' => 'feeNotes',
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
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'parent_name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:1000'],
            'phone' => ['required', 'string', 'max:30'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'program_id' => ['required', 'exists:programs,id'],
            'current_level' => ['nullable', 'string', 'max:50'],
            'level_started_at' => ['nullable', 'date'],
            'level_duration_months' => ['nullable', 'integer', 'between:1,24'],
            'sessions_per_week' => ['required', 'integer', 'between:1,6'],
            'package_started_at' => ['nullable', 'date'],
            'package_ends_at' => ['nullable', 'date', 'after_or_equal:package_started_at'],
            'registration_fee' => ['sometimes', 'integer', 'min:0'],
            'book_fee' => ['sometimes', 'integer', 'min:0'],
            'other_fee' => ['sometimes', 'integer', 'min:0'],
            'discount' => ['sometimes', 'integer', 'min:0'],
            'fee_notes' => ['nullable', 'string', 'max:255'],
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
