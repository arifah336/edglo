<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class StudentAbsence extends Model
{
    protected $fillable = ['student_id', 'class_session_id', 'absence_date', 'reason', 'status', 'recorded_by'];

    protected function casts(): array
    {
        return ['absence_date' => 'date'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class);
    }

    public function makeUpSchedule(): HasOne
    {
        return $this->hasOne(MakeUpSchedule::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
