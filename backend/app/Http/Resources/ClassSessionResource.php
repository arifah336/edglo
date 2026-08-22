<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day' => $this->day,
            'time' => str_replace(':', '.', substr($this->time, 0, 5)),
            'teacherId' => $this->teacher_id,
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'programId' => $this->program_id,
            'program' => new ProgramResource($this->whenLoaded('program')),
            'studentIds' => $this->whenLoaded('students', fn () => $this->students->pluck('id')),
            'students' => StudentResource::collection($this->whenLoaded('students')),
            'room' => $this->room,
            'capacity' => $this->capacity,
            'isActive' => $this->is_active,
            'notes' => $this->notes,
        ];
    }
}
