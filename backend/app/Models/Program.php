<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id',
        'name',
        'description',
        'target_age',
        'price',
        'sessions_per_week',
        'default_package_months',
        'billing_cycle_months',
        'registration_fee',
        'book_fee',
        'discount_percent',
        'discount_min_months',
        'level_options',
        'level_duration_months',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'sessions_per_week' => 'integer',
            'default_package_months' => 'integer',
            'billing_cycle_months' => 'integer',
            'registration_fee' => 'integer',
            'book_fee' => 'integer',
            'discount_percent' => 'integer',
            'discount_min_months' => 'integer',
            'level_options' => 'array',
            'level_duration_months' => 'integer',
            'is_active' => 'boolean',
        ];
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
