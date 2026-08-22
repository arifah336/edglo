<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;

class IdGenerator
{
    /** @param class-string<Model> $modelClass */
    public function next(string $modelClass, string $prefix, int $padding = 3, string $column = 'id'): string
    {
        $maximum = $modelClass::query()
            ->where($column, 'like', $prefix.'%')
            ->pluck($column)
            ->map(fn (string $value) => (int) preg_replace('/\D+/', '', substr($value, strlen($prefix))))
            ->max() ?? 0;

        return $prefix.str_pad((string) ($maximum + 1), $padding, '0', STR_PAD_LEFT);
    }
}
