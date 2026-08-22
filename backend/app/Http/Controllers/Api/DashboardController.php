<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\StudentResource;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Program;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        Payment::where('status', 'pending')->whereDate('due_date', '<', today())->update(['status' => 'overdue']);
        $monthPayments = Payment::where('month', now()->month)->where('year', now()->year);
        $reminders = Payment::with(['student.program', 'student.teacher', 'student.schedules'])
            ->whereIn('status', ['pending', 'overdue'])->orderBy('due_date')->limit(8)->get();
        $latestStudents = Student::with(['program', 'teacher', 'schedules'])->latest('join_date')->limit(5)->get();
        $programs = Program::withCount(['activeStudents'])->orderByDesc('active_students_count')->get();

        return response()->json(['data' => [
            'students' => ['active' => Student::where('status', 'active')->count(), 'total' => Student::count()],
            'teachers' => ['active' => Teacher::where('status', 'active')->count(), 'total' => Teacher::count()],
            'finance' => [
                'receivedThisMonth' => (clone $monthPayments)->where('status', 'paid')->sum('total'),
                'outstandingThisMonth' => (clone $monthPayments)->whereIn('status', ['pending', 'overdue'])->sum('total'),
                'overdueCount' => Payment::where('status', 'overdue')->count(),
                'dueTodayCount' => Payment::whereIn('status', ['pending', 'overdue'])->whereDate('due_date', today())->count(),
            ],
            'schedule' => [
                'todaySessions' => ClassSession::where('day', $this->indonesianDay())->where('is_active', true)->count(),
                'activeSessions' => ClassSession::where('is_active', true)->count(),
            ],
            'programDistribution' => $programs->map(fn ($program) => [
                'id' => $program->id, 'name' => $program->name, 'count' => $program->active_students_count,
            ]),
            'paymentReminders' => PaymentResource::collection($reminders),
            'latestStudents' => StudentResource::collection($latestStudents),
        ]]);
    }

    private function indonesianDay(): string
    {
        return ['Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu'][now()->format('l')];
    }
}
