<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $programs = DB::table('programs')->pluck('name', 'id');

        DB::table('students')
            ->select(['id', 'program_id', 'join_date', 'current_level', 'level_started_at', 'level_duration_months'])
            ->orderBy('id')
            ->each(function ($student) use ($programs) {
                if ($student->current_level && $student->level_duration_months) {
                    return;
                }

                $name = mb_strtolower((string) ($programs[$student->program_id] ?? ''));
                $duration = match (true) {
                    str_contains($name, 'pra') && str_contains($name, 'calistung') => 6,
                    str_contains($name, 'calistung'), str_contains($name, 'english') => 4,
                    default => null,
                };

                if ($duration) {
                    DB::table('students')->where('id', $student->id)->update([
                        'current_level' => $student->current_level ?: 'A',
                        'level_started_at' => $student->level_started_at ?: $student->join_date,
                        'level_duration_months' => $student->level_duration_months ?: $duration,
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Level dapat berubah setelah migrasi, sehingga rollback tidak menghapus progres akademik.
    }
};
