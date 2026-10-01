<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_registrations', function (Blueprint $table) {
            $table->foreignId('parent_user_id')->nullable()->change();
            $table->string('parent_name', 150)->nullable()->after('parent_user_id');
            $table->string('parent_email', 190)->nullable()->after('parent_name');
            $table->string('parent_phone', 30)->nullable()->after('parent_email');
            $table->json('program_selections')->nullable()->after('program_id');
            $table->index(['parent_phone', 'status']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->date('package_started_at')->nullable()->after('sessions_per_week');
            $table->date('package_ends_at')->nullable()->after('package_started_at')->index();
            $table->json('package_selections')->nullable()->after('package_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['package_ends_at']);
            $table->dropColumn(['package_started_at', 'package_ends_at', 'package_selections']);
        });

        Schema::table('course_registrations', function (Blueprint $table) {
            $table->dropIndex(['parent_phone', 'status']);
            $table->dropColumn(['parent_name', 'parent_email', 'parent_phone', 'program_selections']);
            $table->foreignId('parent_user_id')->nullable(false)->change();
        });
    }
};
