<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id', 'full_name', 'address', 'birth_place', 'birth_date', 'religion', 'email',
        'phone', 'last_education', 'join_date', 'leave_date', 'photo', 'employment_type', 'status',
    ];

    protected function casts(): array
    {
        return ['birth_date' => 'date', 'join_date' => 'date', 'leave_date' => 'date'];
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(TeacherStatusHistory::class)->orderBy('date');
    }
}
