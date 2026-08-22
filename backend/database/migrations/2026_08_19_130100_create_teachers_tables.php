<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('full_name');
            $table->text('address');
            $table->string('birth_place');
            $table->date('birth_date');
            $table->string('religion', 40);
            $table->string('email')->unique();
            $table->string('phone', 30);
            $table->string('last_education', 30);
            $table->date('join_date');
            $table->date('leave_date')->nullable();
            $table->string('photo')->nullable();
            $table->string('employment_type', 30)->index();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
        });

        Schema::create('teacher_status_histories', function (Blueprint $table) {
            $table->id();
            $table->string('teacher_id', 20);
            $table->date('date');
            $table->string('action', 30);
            $table->text('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('changed_by_name');
            $table->timestamps();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->index(['teacher_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_status_histories');
        Schema::dropIfExists('teachers');
    }
};
