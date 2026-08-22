<?php

namespace App\Models;

use App\Models\Concerns\HasStringPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory, HasStringPrimaryKey;

    protected $fillable = [
        'id', 'invoice_number', 'student_id', 'month', 'year', 'program_fee',
        'registration_fee', 'book_fee', 'total', 'due_date', 'paid_date', 'status', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer', 'year' => 'integer', 'program_fee' => 'integer',
            'registration_fee' => 'integer', 'book_fee' => 'integer', 'total' => 'integer',
            'due_date' => 'date', 'paid_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(PaymentReminder::class);
    }
}
