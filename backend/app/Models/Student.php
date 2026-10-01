<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id', 'parent_user_id', 'full_name', 'birth_place', 'birth_date', 'parent_name', 'address', 'phone',
        'photo', 'program_id', 'current_level', 'level_started_at', 'level_duration_months', 'sessions_per_week',
        'package_started_at', 'package_ends_at', 'package_selections',
        'registration_fee', 'book_fee', 'other_fee', 'discount', 'fee_notes', 'join_date', 'leave_date',
        'teacher_id', 'notes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'sessions_per_week' => 'integer', 'birth_date' => 'date', 'level_started_at' => 'date',
            'level_duration_months' => 'integer', 'registration_fee' => 'integer', 'book_fee' => 'integer',
            'other_fee' => 'integer', 'discount' => 'integer', 'join_date' => 'date', 'leave_date' => 'date',
            'package_started_at' => 'date', 'package_ends_at' => 'date', 'package_selections' => 'array',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function parentUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(StudentSchedule::class)->orderBy('day')->orderBy('time');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(StudentStatusHistory::class)->orderBy('date');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function classSessions(): BelongsToMany
    {
        return $this->belongsToMany(ClassSession::class)->withTimestamps();
    }

    public function absences(): HasMany
    {
        return $this->hasMany(StudentAbsence::class);
    }

    public function scheduleChangeRequests(): HasMany
    {
        return $this->hasMany(ScheduleChangeRequest::class);
    }
}
