<?php

namespace App\Http\Requests;

use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeacherRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $map = [
            'full_name' => 'fullName', 'birth_place' => 'birthPlace', 'birth_date' => 'birthDate',
            'last_education' => 'lastEducation', 'join_date' => 'joinDate',
            'leave_date' => 'leaveDate', 'employment_type' => 'employmentType',
            'emergency_contact_name' => 'emergencyContactName',
            'emergency_contact_phone' => 'emergencyContactPhone',
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
        /** @var Teacher|null $teacher */
        $teacher = $this->route('teacher');

        return [
            'full_name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:1000'],
            'birth_place' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'religion' => ['required', Rule::in(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'])],
            'email' => ['required', 'email', 'max:190', Rule::unique('teachers', 'email')->ignore($teacher?->id, 'id')],
            'phone' => ['required', 'string', 'max:30'],
            'emergency_contact_name' => ['nullable', 'string', 'max:150'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'last_education' => ['required', Rule::in(['SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'])],
            'join_date' => ['required', 'date'],
            'leave_date' => ['nullable', 'date', 'after_or_equal:join_date'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'employment_type' => ['required', Rule::in(['fulltime', 'parttime', 'magang'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
