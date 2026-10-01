<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MakeUpSchedule extends Model
{
    use HasStringPrimaryKey;

    protected $fillable = [
        'id', 'student_absence_id', 'student_id', 'teacher_id', 'original_session_id',
        'scheduled_date', 'time', 'room', 'status', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return ['scheduled_date' => 'date'];
    }

    public function absence(): BelongsTo
    {
        return $this->belongsTo(StudentAbsence::class, 'student_absence_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function originalSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'original_session_id');
    }
}
