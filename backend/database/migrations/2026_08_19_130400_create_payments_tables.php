<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('invoice_number')->unique();
            $table->string('student_id', 20);
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->unsignedBigInteger('program_fee');
            $table->unsignedBigInteger('registration_fee')->default(0);
            $table->unsignedBigInteger('book_fee')->default(0);
            $table->unsignedBigInteger('total');
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->restrictOnDelete();
            $table->unique(['student_id', 'month', 'year']);
            $table->index(['year', 'month', 'status']);
            $table->index('due_date');
        });

        Schema::create('payment_reminders', function (Blueprint $table) {
            $table->id();
            $table->string('payment_id', 20);
            $table->string('type', 30);
            $table->dateTime('scheduled_for');
            $table->dateTime('sent_at')->nullable();
            $table->string('status', 30)->default('scheduled');
            $table->string('channel', 30)->default('manual');
            $table->text('message')->nullable();
            $table->timestamps();
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            $table->index(['status', 'scheduled_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_reminders');
        Schema::dropIfExists('payments');
    }
};
