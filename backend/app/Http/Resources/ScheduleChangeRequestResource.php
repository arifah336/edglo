<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleChangeRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent' => $this->whenLoaded('parentUser', fn () => [
                'id' => $this->parentUser->code,
                'name' => $this->parentUser->name,
                'email' => $this->parentUser->email,
                'phone' => $this->parentUser->phone,
            ]),
            'studentId' => $this->student_id,
            'studentName' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'teacherName' => $this->whenLoaded('student', fn () => $this->student->teacher?->full_name),
            'programName' => $this->whenLoaded('student', fn () => $this->student->program?->name),
            'currentSessionId' => $this->current_session_id,
            'targetSessionId' => $this->target_session_id,
            'currentDay' => $this->current_day,
            'currentTime' => $this->formatTime($this->current_time),
            'requestedDay' => $this->requested_day,
            'requestedTime' => $this->formatTime($this->requested_time),
            'reason' => $this->reason,
            'details' => $this->details,
            'status' => $this->status,
            'adminNotes' => $this->admin_notes,
            'reviewedBy' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewedAt' => $this->reviewed_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }

    private function formatTime(?string $time): ?string
    {
        return $time ? str_replace(':', '.', substr($time, 0, 5)) : null;
    }
}
