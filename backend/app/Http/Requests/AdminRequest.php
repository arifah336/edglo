<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('isActive')) {
            $this->merge(['is_active' => $this->input('isActive')]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() === true;
    }

    public function rules(): array
    {
        /** @var User|null $admin */
        $admin = $this->route('admin');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($admin?->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(['super_admin', 'admin'])],
            'is_active' => ['sometimes', 'boolean'],
            'password' => [$admin ? 'nullable' : 'required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
