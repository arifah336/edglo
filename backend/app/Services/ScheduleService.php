<?php

namespace App\Services;

use App\Models\Student;

class ScheduleService
{
    /** @param array<int, string> $studentIds */
    public function rebuildForStudents(array $studentIds): void
    {
        Student::query()->whereIn('id', array_unique($studentIds))->each(function (Student $student) {
            $sessions = $student->classSessions()->where('is_active', true)->get(['day', 'time']);
            $student->schedules()->delete();

            foreach ($sessions->unique(fn ($session) => $session->day.'-'.$session->time) as $session) {
                $student->schedules()->create(['day' => $session->day, 'time' => $session->time]);
            }
        });
    }
}
