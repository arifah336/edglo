<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'isActive' => $this->is_active,
            'createdAt' => $this->created_at?->toDateString(),
            'lastLoginAt' => $this->last_login_at?->toIso8601String(),
        ];
    }
}
