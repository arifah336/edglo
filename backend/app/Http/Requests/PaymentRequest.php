<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $map = [
            'student_id' => 'studentId', 'program_fee' => 'programFee',
            'registration_fee' => 'registrationFee', 'book_fee' => 'bookFee',
            'due_date' => 'dueDate', 'paid_date' => 'paidDate',
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
            'student_id' => ['required', 'exists:students,id'],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2020,2100'],
            'program_fee' => ['nullable', 'integer', 'min:0'],
            'registration_fee' => ['nullable', 'integer', 'min:0'],
            'book_fee' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['paid', 'pending', 'overdue'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
