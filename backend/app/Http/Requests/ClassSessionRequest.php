<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassSessionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $map = ['teacher_id' => 'teacherId', 'program_id' => 'programId', 'student_ids' => 'studentIds', 'is_active' => 'isActive'];
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
            'day' => ['required', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3])[:.]([0-5]\d)$/'],
            'teacher_id' => ['required', 'exists:teachers,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'student_ids' => ['present', 'array'],
            'student_ids.*' => ['distinct', 'exists:students,id'],
            'room' => ['required', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'between:1,50'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
