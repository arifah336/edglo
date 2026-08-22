<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherStatusHistory extends Model
{
    protected $fillable = ['teacher_id', 'date', 'action', 'reason', 'changed_by', 'changed_by_name'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
