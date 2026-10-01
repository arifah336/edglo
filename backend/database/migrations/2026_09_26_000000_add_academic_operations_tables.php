<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('birth_place')->nullable()->after('full_name');
            $table->date('birth_date')->nullable()->after('birth_place');
            $table->string('current_level', 50)->nullable()->after('program_id');
            $table->date('level_started_at')->nullable()->after('current_level');
            $table->unsignedTinyInteger('level_duration_months')->nullable()->after('level_started_at');
            $table->unsignedBigInteger('registration_fee')->default(100000)->after('sessions_per_week');
            $table->unsignedBigInteger('book_fee')->default(100000)->after('registration_fee');
            $table->unsignedBigInteger('other_fee')->default(0)->after('book_fee');
            $table->unsignedBigInteger('discount')->default(0)->after('other_fee');
            $table->string('fee_notes')->nullable()->after('discount');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('emergency_contact_name')->nullable()->after('phone');
            $table->string('emergency_contact_phone', 30)->nullable()->after('emergency_contact_name');
            $table->text('notes')->nullable()->after('employment_type');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('other_fee')->default(0)->after('book_fee');
            $table->unsignedBigInteger('discount')->default(0)->after('other_fee');
        });

        Schema::create('teacher_attendances', function (Blueprint $table) {
            $table->id();
            $table->string('teacher_id', 20);
            $table->string('class_session_id', 20);
            $table->date('attendance_date');
            $table->string('status', 20)->default('present');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->unique(['teacher_id', 'class_session_id', 'attendance_date'], 'teacher_attendance_unique');
            $table->index(['attendance_date', 'status']);
        });

        Schema::create('student_absences', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 20);
            $table->string('class_session_id', 20);
            $table->date('absence_date');
            $table->text('reason')->nullable();
            $table->string('status', 30)->default('open');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->unique(['student_id', 'class_session_id', 'absence_date'], 'student_absence_unique');
            $table->index(['absence_date', 'status']);
        });

        Schema::create('make_up_schedules', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('student_absence_id')->unique()->constrained('student_absences')->cascadeOnDelete();
            $table->string('student_id', 20);
            $table->string('teacher_id', 20);
            $table->string('original_session_id', 20);
            $table->date('scheduled_date');
            $table->time('time');
            $table->string('room', 80);
            $table->string('status', 30)->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->restrictOnDelete();
            $table->foreign('original_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->index(['scheduled_date', 'teacher_id']);
        });

        Schema::create('teacher_payrolls', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('teacher_id', 20);
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->unsignedSmallInteger('attendance_count')->default(0);
            $table->unsignedBigInteger('rate_per_session')->default(0);
            $table->unsignedBigInteger('base_salary')->default(0);
            $table->unsignedBigInteger('allowance')->default(0);
            $table->unsignedBigInteger('deduction')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->string('status', 20)->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->unique(['teacher_id', 'month', 'year']);
            $table->index(['year', 'month', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_payrolls');
        Schema::dropIfExists('make_up_schedules');
        Schema::dropIfExists('student_absences');
        Schema::dropIfExists('teacher_attendances');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['other_fee', 'discount']);
        });
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn(['emergency_contact_name', 'emergency_contact_phone', 'notes']);
        });
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'birth_place', 'birth_date', 'current_level', 'level_started_at', 'level_duration_months',
                'registration_fee', 'book_fee', 'other_fee', 'discount', 'fee_notes',
            ]);
        });
    }
};
