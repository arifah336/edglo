<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseRegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $preferredSchedules = $this->preferred_schedules ?: collect($this->preferred_days ?? [])
            ->map(fn (string $day) => ['day' => $day, 'time' => $this->preferred_time])
            ->values()
            ->all();

        return [
            'id' => $this->id,
            'parent' => [
                'id' => $this->parentUser?->code ?? 'FORM-'.$this->id,
                'name' => $this->parent_name ?? $this->parentUser?->name,
                'email' => $this->parent_email ?? $this->parentUser?->email,
                'phone' => $this->parent_phone ?? $this->parentUser?->phone,
            ],
            'programId' => $this->program_id,
            'program' => new ProgramResource($this->whenLoaded('program')),
            'programSelections' => $this->program_selections ?? [[
                'programId' => $this->program_id,
                'months' => 1,
            ]],
            'studentId' => $this->student_id,
            'childName' => $this->child_name,
            'childAge' => $this->child_age,
            'address' => $this->address,
            'preferredDays' => $this->preferred_days ?? [],
            'preferredTime' => $this->preferred_time,
            'preferredSchedules' => $preferredSchedules,
            'notes' => $this->notes,
            'status' => $this->status,
            'adminNotes' => $this->admin_notes,
            'reviewedBy' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewedAt' => $this->reviewed_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
