<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_change_requests', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('parent_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('student_id', 20);
            $table->string('current_session_id', 20)->nullable();
            $table->string('target_session_id', 20)->nullable();
            $table->string('current_day', 20);
            $table->time('current_time');
            $table->string('requested_day', 20);
            $table->time('requested_time');
            $table->string('reason', 40);
            $table->text('details');
            $table->string('status', 20)->default('pending')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('current_session_id')->references('id')->on('class_sessions')->nullOnDelete();
            $table->foreign('target_session_id')->references('id')->on('class_sessions')->nullOnDelete();
            $table->index(['parent_user_id', 'status']);
            $table->index(['student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_change_requests');
    }
};
