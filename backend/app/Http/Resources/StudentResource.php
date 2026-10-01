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
            'birthPlace' => $this->birth_place,
            'birthDate' => $this->birth_date?->toDateString(),
            'parentName' => $this->parent_name,
            'address' => $this->address,
            'phone' => $this->phone,
            'photo' => $this->photo ? Storage::url($this->photo) : null,
            'programId' => $this->program_id,
            'program' => new ProgramResource($this->whenLoaded('program')),
            'currentLevel' => $this->current_level,
            'levelStartedAt' => $this->level_started_at?->toDateString(),
            'levelDurationMonths' => $this->level_duration_months,
            'sessionsPerWeek' => $this->sessions_per_week,
            'packageStartedAt' => $this->package_started_at?->toDateString(),
            'packageEndsAt' => $this->package_ends_at?->toDateString(),
            'packageSelections' => $this->package_selections ?? [],
            'registrationFee' => $this->registration_fee,
            'bookFee' => $this->book_fee,
            'otherFee' => $this->other_fee,
            'discount' => $this->discount,
            'feeNotes' => $this->fee_notes,
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
