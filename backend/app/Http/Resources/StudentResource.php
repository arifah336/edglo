<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fullName' => $this->full_name,
            'parentName' => $this->parent_name,
            'address' => $this->address,
            'phone' => $this->phone,
            'photo' => $this->photo ? url(Storage::url($this->photo)) : null,
            'programId' => $this->program_id,
            'program' => new ProgramResource($this->whenLoaded('program')),
            'sessionsPerWeek' => $this->sessions_per_week,
            'joinDate' => $this->join_date?->toDateString(),
            'leaveDate' => $this->leave_date?->toDateString(),
            'teacherId' => $this->teacher_id,
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'schedules' => $this->whenLoaded('schedules', fn () => $this->schedules->map(fn ($schedule) => [
                'day' => $schedule->day,
                'time' => str_replace(':', '.', substr($schedule->time, 0, 5)),
            ])),
            'notes' => $this->notes,
            'status' => $this->status,
            'statusHistory' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories->map(fn ($history) => [
                'date' => $history->date->toDateString(),
                'action' => $history->action,
                'reason' => $history->reason,
                'by' => $history->changed_by_name,
            ])),
        ];
    }
}
