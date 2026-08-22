<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public const REGISTRATION_FEE = 100000;

    public const BOOK_FEE = 100000;

    public function __construct(private readonly IdGenerator $ids) {}

    public function create(Student $student, array $attributes, ?int $userId = null): Payment
    {
        return DB::transaction(function () use ($student, $attributes, $userId) {
            $month = (int) $attributes['month'];
            $year = (int) $attributes['year'];
            $dueDate = Carbon::parse($attributes['due_date']);
            $programFee = (int) ($attributes['program_fee'] ?? $student->program->price);
            $isFirstInvoice = ! $student->payments()->exists();
            $periodStart = Carbon::create($year, $month, 1);
            $joinPeriod = $student->join_date->copy()->startOfMonth();
            $monthsSinceJoining = (int) max(0, $joinPeriod->diffInMonths($periodStart, false));
            $registrationFee = (int) ($attributes['registration_fee'] ?? ($isFirstInvoice ? self::REGISTRATION_FEE : 0));
            $bookFee = (int) ($attributes['book_fee'] ?? ($monthsSinceJoining % 2 === 0 ? self::BOOK_FEE : 0));
            $paidDate = isset($attributes['paid_date']) ? Carbon::parse($attributes['paid_date']) : null;
            $status = $attributes['status'] ?? ($paidDate ? 'paid' : ($dueDate->isPast() ? 'overdue' : 'pending'));
            $id = $this->ids->next(Payment::class, 'PAY', 4);

            $payment = Payment::create([
                'id' => $id,
                'invoice_number' => sprintf('INV/%d/%02d/%04d', $year, $month, (int) substr($id, 3)),
                'student_id' => $student->id,
                'month' => $month,
                'year' => $year,
                'program_fee' => $programFee,
                'registration_fee' => $registrationFee,
                'book_fee' => $bookFee,
                'total' => $programFee + $registrationFee + $bookFee,
                'due_date' => $dueDate,
                'paid_date' => $paidDate,
                'status' => $status,
                'notes' => $attributes['notes'] ?? null,
                'created_by' => $userId,
            ]);

            if ($status !== 'paid') {
                $payment->reminders()->create([
                    'type' => 'upcoming',
                    'scheduled_for' => $dueDate->copy()->subDays(3)->setTime(8, 0),
                    'status' => 'scheduled',
                    'channel' => 'manual',
                    'message' => "Pengingat tagihan {$payment->invoice_number}",
                ]);
            }

            return $payment;
        });
    }

    public function generateMonth(int $month, int $year, ?int $userId = null): int
    {
        $created = 0;
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();

        Student::query()
            ->with('program')
            ->whereDate('join_date', '<=', $periodEnd)
            ->where(fn ($query) => $query->whereNull('leave_date')->orWhereDate('leave_date', '>=', $periodEnd->copy()->startOfMonth()))
            ->chunkById(100, function ($students) use ($month, $year, $userId, &$created) {
                foreach ($students as $student) {
                    if ($student->payments()->where('month', $month)->where('year', $year)->exists()) {
                        continue;
                    }

                    $lastDay = Carbon::create($year, $month, 1)->daysInMonth;
                    $dueDay = min($student->join_date->day, $lastDay);
                    $this->create($student, [
                        'month' => $month,
                        'year' => $year,
                        'due_date' => Carbon::create($year, $month, $dueDay)->toDateString(),
                    ], $userId);
                    $created++;
                }
            }, 'id');

        return $created;
    }
}
