<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('parent_user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->index(['parent_user_id', 'status']);
        });

        Schema::create('course_registrations', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('parent_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('program_id', 60);
            $table->string('student_id', 20)->nullable();
            $table->string('child_name');
            $table->unsignedTinyInteger('child_age');
            $table->text('address');
            $table->json('preferred_days')->nullable();
            $table->string('preferred_time', 20)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('program_id')->references('id')->on('programs')->restrictOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $table->index(['parent_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_registrations');

        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['parent_user_id']);
            $table->dropIndex(['parent_user_id', 'status']);
            $table->dropColumn('parent_user_id');
        });
    }
};
