<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->string('target_age', 100)->nullable()->after('description');
            $table->unsignedTinyInteger('default_package_months')->default(2)->after('sessions_per_week');
            $table->unsignedTinyInteger('billing_cycle_months')->default(2)->after('default_package_months');
            $table->unsignedBigInteger('registration_fee')->default(0)->after('billing_cycle_months');
            $table->unsignedBigInteger('book_fee')->default(0)->after('registration_fee');
            $table->unsignedTinyInteger('discount_percent')->default(0)->after('book_fee');
            $table->unsignedTinyInteger('discount_min_months')->default(2)->after('discount_percent');
            $table->json('level_options')->nullable()->after('discount_min_months');
            $table->unsignedTinyInteger('level_duration_months')->nullable()->after('level_options');
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'target_age',
                'default_package_months',
                'billing_cycle_months',
                'registration_fee',
                'book_fee',
                'discount_percent',
                'discount_min_months',
                'level_options',
                'level_duration_months',
            ]);
        });
    }
};
