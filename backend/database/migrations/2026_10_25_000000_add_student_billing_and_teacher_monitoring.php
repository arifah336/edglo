<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedBigInteger('billing_amount')->default(0)->after('sessions_per_week');
            $table->unsignedTinyInteger('billing_cycle_months')->default(2)->after('billing_amount');
            $table->date('billing_started_at')->nullable()->after('billing_cycle_months')->index();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->unique()->after('id')->constrained('users')->nullOnDelete();
        });

        Schema::create('student_progress_logs', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 20);
            $table->string('teacher_id', 20);
            $table->date('activity_date');
            $table->string('activity_type', 30)->default('reading');
            $table->unsignedSmallInteger('points')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->index(['teacher_id', 'activity_date']);
            $table->index(['student_id', 'activity_date']);
        });

        DB::table('students')->orderBy('id')->each(function (object $student) {
            $programPrice = (int) DB::table('programs')->where('id', $student->program_id)->value('price');
            DB::table('students')->where('id', $student->id)->update([
                'billing_amount' => $programPrice * 2,
                'billing_cycle_months' => 2,
                'billing_started_at' => $student->package_started_at ?? $student->join_date,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_progress_logs');

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['billing_started_at']);
            $table->dropColumn(['billing_amount', 'billing_cycle_months', 'billing_started_at']);
        });
    }
};
