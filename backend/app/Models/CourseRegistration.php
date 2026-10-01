<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseRegistration extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id', 'parent_user_id', 'parent_name', 'parent_email', 'parent_phone', 'program_id', 'program_selections',
        'student_id', 'child_name', 'child_age',
        'address', 'preferred_days', 'preferred_time', 'preferred_schedules', 'notes', 'status', 'admin_notes',
        'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'child_age' => 'integer',
            'program_selections' => 'array',
            'preferred_days' => 'array',
            'preferred_schedules' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function parentUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
