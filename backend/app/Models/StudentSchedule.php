<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSchedule extends Model
{
    protected $fillable = ['student_id', 'day', 'time'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
