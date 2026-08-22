<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('full_name');
            $table->string('parent_name');
            $table->text('address');
            $table->string('phone', 30);
            $table->string('photo')->nullable();
            $table->string('program_id', 60);
            $table->unsignedTinyInteger('sessions_per_week');
            $table->date('join_date');
            $table->date('leave_date')->nullable();
            $table->string('teacher_id', 20)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
            $table->foreign('program_id')->references('id')->on('programs')->restrictOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
            $table->index(['program_id', 'status']);
            $table->index(['teacher_id', 'status']);
        });

        Schema::create('student_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 20);
            $table->string('day', 20);
            $table->time('time');
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->unique(['student_id', 'day', 'time']);
            $table->index(['day', 'time']);
        });

        Schema::create('student_status_histories', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 20);
            $table->date('date');
            $table->string('action', 30);
            $table->text('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('changed_by_name');
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->index(['student_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_status_histories');
        Schema::dropIfExists('student_schedules');
        Schema::dropIfExists('students');
    }
};
