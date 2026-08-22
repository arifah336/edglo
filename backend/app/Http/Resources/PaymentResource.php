<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoiceNumber' => $this->invoice_number,
            'studentId' => $this->student_id,
            'student' => new StudentResource($this->whenLoaded('student')),
            'month' => $this->month,
            'year' => $this->year,
            'programFee' => $this->program_fee,
            'registrationFee' => $this->registration_fee,
            'bookFee' => $this->book_fee,
            'total' => $this->total,
            'dueDate' => $this->due_date?->toDateString(),
            'paidDate' => $this->paid_date?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
