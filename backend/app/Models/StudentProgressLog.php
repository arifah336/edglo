<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProgressLog extends Model
{
    protected $fillable = [
        'student_id', 'teacher_id', 'activity_date', 'activity_type', 'points', 'notes', 'recorded_by',
    ];

    protected function casts(): array
    {
        return ['activity_date' => 'date', 'points' => 'integer'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
