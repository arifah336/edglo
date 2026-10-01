<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAbsenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'studentId' => $this->student_id,
            'studentName' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'classSessionId' => $this->class_session_id,
            'session' => $this->whenLoaded('classSession', fn () => [
                'day' => $this->classSession->day,
                'time' => str_replace(':', '.', substr($this->classSession->time, 0, 5)),
                'teacherId' => $this->classSession->teacher_id,
                'teacherName' => $this->classSession->relationLoaded('teacher') ? $this->classSession->teacher?->full_name : null,
                'room' => $this->classSession->room,
            ]),
            'absenceDate' => $this->absence_date?->toDateString(),
            'reason' => $this->reason,
            'status' => $this->status,
            'makeUpSchedule' => new MakeUpScheduleResource($this->whenLoaded('makeUpSchedule')),
        ];
    }
}
