<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'targetAge' => $this->target_age,
            'price' => $this->price,
            'sessionsPerWeek' => $this->sessions_per_week,
            'defaultPackageMonths' => $this->default_package_months,
            'billingCycleMonths' => $this->billing_cycle_months,
            'registrationFee' => $this->registration_fee,
            'bookFee' => $this->book_fee,
            'discountPercent' => $this->discount_percent,
            'discountMinMonths' => $this->discount_min_months,
            'levelOptions' => $this->level_options ?? [],
            'levelDurationMonths' => $this->level_duration_months,
            'isActive' => $this->is_active,
            'activeStudentsCount' => $this->whenCounted('activeStudents'),
        ];
    }
}
