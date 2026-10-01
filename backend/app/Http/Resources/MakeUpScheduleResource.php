<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MakeUpScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'studentAbsenceId' => (string) $this->student_absence_id,
            'studentId' => $this->student_id,
            'studentName' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'teacherId' => $this->teacher_id,
            'teacherName' => $this->whenLoaded('teacher', fn () => $this->teacher->full_name),
            'originalSessionId' => $this->original_session_id,
            'scheduledDate' => $this->scheduled_date?->toDateString(),
            'time' => str_replace(':', '.', substr($this->time, 0, 5)),
            'room' => $this->room,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
