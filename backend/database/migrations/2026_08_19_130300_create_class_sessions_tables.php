<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_sessions', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('day', 20)->index();
            $table->time('time');
            $table->string('teacher_id', 20);
            $table->string('program_id', 60);
            $table->string('room', 80);
            $table->unsignedSmallInteger('capacity')->default(8);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->foreign('teacher_id')->references('id')->on('teachers')->restrictOnDelete();
            $table->foreign('program_id')->references('id')->on('programs')->restrictOnDelete();
            $table->unique(['day', 'time', 'teacher_id']);
        });

        Schema::create('class_session_student', function (Blueprint $table) {
            $table->id();
            $table->string('class_session_id', 20);
            $table->string('student_id', 20);
            $table->timestamps();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->unique(['class_session_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_session_student');
        Schema::dropIfExists('class_sessions');
    }
};
