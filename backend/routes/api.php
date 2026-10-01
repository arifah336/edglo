<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\CourseRegistrationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MakeUpScheduleController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\PublicRegistrationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StudentAbsenceController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherAttendanceController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TeacherPayrollController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');
    Route::post('registrations', PublicRegistrationController::class)->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::middleware('role:super_admin,admin')->group(function () {
            Route::get('workspace', WorkspaceController::class);
            Route::get('dashboard', DashboardController::class);
            Route::get('programs', [ProgramController::class, 'index']);
            Route::get('programs/{program}', [ProgramController::class, 'show']);
            Route::get('students', [StudentController::class, 'index']);
            Route::get('students/{student}', [StudentController::class, 'show']);
            Route::get('teachers', [TeacherController::class, 'index']);
            Route::get('teachers/{teacher}', [TeacherController::class, 'show']);
            Route::get('class-sessions', [ClassSessionController::class, 'index']);
            Route::get('class-sessions/{classSession}', [ClassSessionController::class, 'show']);
            Route::get('payments/summary', [PaymentController::class, 'summary']);
            Route::get('payments', [PaymentController::class, 'index']);
            Route::get('payments/{payment}', [PaymentController::class, 'show']);
            Route::get('teacher-attendances', [TeacherAttendanceController::class, 'index']);
            Route::get('student-absences', [StudentAbsenceController::class, 'index']);
            Route::get('make-up-schedules', [MakeUpScheduleController::class, 'index']);

            Route::get('reports/overview', [ReportController::class, 'overview']);
            Route::get('reports/download', [ReportController::class, 'download']);

            Route::middleware('role:admin')->group(function () {
                Route::get('registrations', [CourseRegistrationController::class, 'index']);
                Route::post('registrations/{registration}/approve', [CourseRegistrationController::class, 'approve']);
                Route::post('registrations/{registration}/reject', [CourseRegistrationController::class, 'reject']);
                Route::post('students/{student}/deactivate', [StudentController::class, 'deactivate']);
                Route::post('students/{student}/activate', [StudentController::class, 'activate']);
                Route::post('students', [StudentController::class, 'store']);
                Route::match(['put', 'patch'], 'students/{student}', [StudentController::class, 'update']);
                Route::delete('students/{student}', [StudentController::class, 'destroy']);

                Route::post('class-sessions', [ClassSessionController::class, 'store']);
                Route::match(['put', 'patch'], 'class-sessions/{classSession}', [ClassSessionController::class, 'update']);
                Route::delete('class-sessions/{classSession}', [ClassSessionController::class, 'destroy']);

                Route::post('payments/generate-month', [PaymentController::class, 'generateMonth']);
                Route::post('payments/{payment}/mark-paid', [PaymentController::class, 'markPaid']);
                Route::post('payments/{payment}/reminders', [PaymentController::class, 'sendReminder']);
                Route::post('payments', [PaymentController::class, 'store']);
                Route::match(['put', 'patch'], 'payments/{payment}', [PaymentController::class, 'update']);
                Route::delete('payments/{payment}', [PaymentController::class, 'destroy']);

                Route::post('teacher-attendances', [TeacherAttendanceController::class, 'store']);
                Route::delete('teacher-attendances/{teacherAttendance}', [TeacherAttendanceController::class, 'destroy']);
                Route::post('student-absences', [StudentAbsenceController::class, 'store']);
                Route::delete('student-absences/{studentAbsence}', [StudentAbsenceController::class, 'destroy']);
                Route::post('make-up-schedules', [MakeUpScheduleController::class, 'store']);
                Route::match(['put', 'patch'], 'make-up-schedules/{makeUpSchedule}', [MakeUpScheduleController::class, 'update']);
                Route::delete('make-up-schedules/{makeUpSchedule}', [MakeUpScheduleController::class, 'destroy']);
            });

            Route::middleware('role:super_admin')->group(function () {
                Route::post('programs', [ProgramController::class, 'store']);
                Route::match(['put', 'patch'], 'programs/{program}', [ProgramController::class, 'update']);
                Route::delete('programs/{program}', [ProgramController::class, 'destroy']);
                Route::post('teachers/{teacher}/deactivate', [TeacherController::class, 'deactivate']);
                Route::post('teachers/{teacher}/activate', [TeacherController::class, 'activate']);
                Route::post('teachers', [TeacherController::class, 'store']);
                Route::match(['put', 'patch'], 'teachers/{teacher}', [TeacherController::class, 'update']);
                Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy']);
                Route::get('teacher-payrolls', [TeacherPayrollController::class, 'index']);
                Route::post('teacher-payrolls', [TeacherPayrollController::class, 'store']);
                Route::delete('teacher-payrolls/{teacherPayroll}', [TeacherPayrollController::class, 'destroy']);
                Route::apiResource('admins', AdminController::class);
            });
        });
    });
});
