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
        'id', 'full_name', 'parent_name', 'address', 'phone', 'photo', 'program_id',
        'sessions_per_week', 'join_date', 'leave_date', 'teacher_id', 'notes', 'status',
    ];

    protected function casts(): array
    {
        return ['sessions_per_week' => 'integer', 'join_date' => 'date', 'leave_date' => 'date'];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
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
}
