<?php

namespace App\Services;

use App\Models\Program;

class ProgramLevelService
{
    /**
     * @return array{current_level: string|null, level_duration_months: int|null}
     */
    public function defaultsFor(string $programId): array
    {
        $name = mb_strtolower((string) Program::query()->whereKey($programId)->value('name'));

        if (str_contains($name, 'pra') && str_contains($name, 'calistung')) {
            return ['current_level' => 'A', 'level_duration_months' => 6];
        }

        if (str_contains($name, 'calistung') || str_contains($name, 'english')) {
            return ['current_level' => 'A', 'level_duration_months' => 4];
        }

        return ['current_level' => null, 'level_duration_months' => null];
    }

    /**
     * @return list<string>
     */
    public function levelsFor(string $programId): array
    {
        $name = mb_strtolower((string) Program::query()->whereKey($programId)->value('name'));

        if (str_contains($name, 'pra') && str_contains($name, 'calistung')) {
            return ['A', 'B', 'C'];
        }

        if (str_contains($name, 'calistung')) {
            return ['A', 'B', 'C', 'D', 'E', 'Persiapan SD'];
        }

        if (str_contains($name, 'english')) {
            return ['A', 'B', 'C', 'D', 'E'];
        }

        return [];
    }
}
