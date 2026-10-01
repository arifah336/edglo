<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fullName' => $this->full_name,
            'address' => $this->address,
            'birthPlace' => $this->birth_place,
            'birthDate' => $this->birth_date?->toDateString(),
            'religion' => $this->religion,
            'email' => $this->email,
            'phone' => $this->phone,
            'emergencyContactName' => $this->emergency_contact_name,
            'emergencyContactPhone' => $this->emergency_contact_phone,
            'lastEducation' => $this->last_education,
            'joinDate' => $this->join_date?->toDateString(),
            'leaveDate' => $this->leave_date?->toDateString(),
            'photo' => $this->photo ? Storage::url($this->photo) : null,
            'employmentType' => $this->employment_type,
            'notes' => $this->notes,
            'status' => $this->status,
            'studentsCount' => $this->whenCounted('students'),
            'statusHistory' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories->map(fn ($history) => [
                'date' => $history->date->toDateString(),
                'action' => $history->action,
                'reason' => $history->reason,
                'by' => $history->changed_by_name,
            ])),
        ];
    }
}
