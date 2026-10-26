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
            $billingCycle = max(1, (int) $student->billing_cycle_months);
            $programFee = (int) ($attributes['program_fee'] ?? ($student->billing_amount > 0 ? $student->billing_amount : $student->program->price * $billingCycle));
            $isFirstInvoice = ! $student->payments()->exists();
            $periodStart = Carbon::create($year, $month, 1);
            $joinPeriod = $student->join_date->copy()->startOfMonth();
            $monthsSinceJoining = (int) max(0, $joinPeriod->diffInMonths($periodStart, false));
            $registrationFee = (int) ($attributes['registration_fee'] ?? ($isFirstInvoice ? $student->registration_fee : 0));
            $bookFee = (int) ($attributes['book_fee'] ?? ($isFirstInvoice ? $student->book_fee : 0));
            $otherFee = (int) ($attributes['other_fee'] ?? ($isFirstInvoice ? $student->other_fee : 0));
            $discount = (int) ($attributes['discount'] ?? ($isFirstInvoice ? $student->discount : 0));
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
                'other_fee' => $otherFee,
                'discount' => $discount,
                'total' => max(0, $programFee + $registrationFee + $bookFee + $otherFee - $discount),
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
            ->where('status', 'active')
            ->where(fn ($query) => $query
                ->whereDate('billing_started_at', '<=', $periodEnd)
                ->orWhere(fn ($fallback) => $fallback->whereNull('billing_started_at')->whereDate('join_date', '<=', $periodEnd)))
            ->chunkById(100, function ($students) use ($month, $year, $userId, &$created) {
                foreach ($students as $student) {
                    $billingStart = $student->billing_started_at ?? $student->join_date;
                    $periodStart = Carbon::create($year, $month, 1);
                    $monthsSinceBillingStart = $billingStart->copy()->startOfMonth()->diffInMonths($periodStart, false);
                    $billingCycle = max(1, (int) $student->billing_cycle_months);
                    if ($monthsSinceBillingStart < 0 || $monthsSinceBillingStart % $billingCycle !== 0) {
                        continue;
                    }
                    if ($student->payments()->where('month', $month)->where('year', $year)->exists()) {
                        continue;
                    }

                    $lastDay = Carbon::create($year, $month, 1)->daysInMonth;
                    $dueDay = min($billingStart->day, $lastDay);
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
