<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only rows that still exactly match the first migration's untouched defaults are aligned.
        DB::table('programs')
            ->whereNull('description')
            ->whereNull('target_age')
            ->where('default_package_months', 2)
            ->where('billing_cycle_months', 1)
            ->where('registration_fee', 0)
            ->where('book_fee', 0)
            ->where('discount_percent', 0)
            ->whereNull('level_options')
            ->update(['billing_cycle_months' => 2]);
    }

    public function down(): void
    {
        // Existing commercial settings are intentionally preserved.
    }
};
