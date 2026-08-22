<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = ['id', 'name', 'price', 'sessions_per_week', 'is_active'];

    protected function casts(): array
    {
        return ['price' => 'integer', 'sessions_per_week' => 'integer', 'is_active' => 'boolean'];
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function activeStudents(): HasMany
    {
        return $this->hasMany(Student::class)->where('status', 'active');
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }
}
