<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'teacherId' => $this->teacher_id,
            'teacherName' => $this->whenLoaded('teacher', fn () => $this->teacher->full_name),
            'classSessionId' => $this->class_session_id,
            'session' => $this->whenLoaded('classSession', fn () => [
                'day' => $this->classSession->day,
                'time' => str_replace(':', '.', substr($this->classSession->time, 0, 5)),
                'room' => $this->classSession->room,
            ]),
            'attendanceDate' => $this->attendance_date?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'recordedBy' => $this->whenLoaded('recorder', fn () => $this->recorder?->name),
        ];
    }
}
