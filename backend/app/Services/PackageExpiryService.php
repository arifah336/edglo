<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Support\Facades\DB;

class PackageExpiryService
{
    public function deactivateExpiredStudents(): int
    {
        $count = 0;
        Student::query()
            ->where('status', 'active')
            ->whereNotNull('package_ends_at')
            ->whereDate('package_ends_at', '<', today())
            ->each(function (Student $student) use (&$count) {
                DB::transaction(function () use ($student, &$count) {
                    $locked = Student::query()->lockForUpdate()->find($student->id);
                    if (! $locked || $locked->status !== 'active' || ! $locked->package_ends_at?->isBefore(today())) {
                        return;
                    }

                    $locked->update(['status' => 'off', 'leave_date' => $locked->package_ends_at]);
                    $locked->classSessions()->detach();
                    $locked->statusHistories()->create([
                        'date' => $locked->package_ends_at,
                        'action' => 'deactivated',
                        'reason' => 'Masa paket berakhir dan belum diperpanjang.',
                        'changed_by_name' => 'Sistem EdGLO',
                    ]);
                    $count++;
                });
            });

        return $count;
    }
}
