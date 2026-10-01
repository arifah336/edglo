<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherPayroll extends Model
{
    use HasStringPrimaryKey;

    protected $fillable = [
        'id', 'teacher_id', 'month', 'year', 'attendance_count', 'rate_per_session',
        'base_salary', 'allowance', 'deduction', 'total', 'status', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer', 'year' => 'integer', 'attendance_count' => 'integer',
            'rate_per_session' => 'integer', 'base_salary' => 'integer', 'allowance' => 'integer',
            'deduction' => 'integer', 'total' => 'integer',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
