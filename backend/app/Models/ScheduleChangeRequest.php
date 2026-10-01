<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleChangeRequest extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id', 'parent_user_id', 'student_id', 'current_session_id', 'target_session_id',
        'current_day', 'current_time', 'requested_day', 'requested_time', 'reason',
        'details', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function parentUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function currentSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'current_session_id');
    }

    public function targetSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'target_session_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
