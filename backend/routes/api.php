<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('bootstrap', BootstrapController::class);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('dashboard', DashboardController::class);
        Route::apiResource('programs', ProgramController::class);

        Route::post('students/{student}/deactivate', [StudentController::class, 'deactivate']);
        Route::post('students/{student}/activate', [StudentController::class, 'activate']);
        Route::apiResource('students', StudentController::class);

        Route::post('teachers/{teacher}/deactivate', [TeacherController::class, 'deactivate']);
        Route::post('teachers/{teacher}/activate', [TeacherController::class, 'activate']);
        Route::apiResource('teachers', TeacherController::class);

        Route::apiResource('class-sessions', ClassSessionController::class);

        Route::get('payments/summary', [PaymentController::class, 'summary']);
        Route::post('payments/generate-month', [PaymentController::class, 'generateMonth']);
        Route::post('payments/{payment}/mark-paid', [PaymentController::class, 'markPaid']);
        Route::post('payments/{payment}/reminders', [PaymentController::class, 'sendReminder']);
        Route::apiResource('payments', PaymentController::class);

        Route::get('reports/overview', [ReportController::class, 'overview']);
        Route::get('reports/download', [ReportController::class, 'download']);

        Route::middleware('role:super_admin')->apiResource('admins', AdminController::class);
    });
});
