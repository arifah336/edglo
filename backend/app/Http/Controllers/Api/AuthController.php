<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function adminLogin(LoginRequest $request): JsonResponse
    {
        return $this->authenticate(
            $request,
            ['super_admin', 'admin'],
            'Akun ini tidak memiliki akses ke Portal Admin.',
            'edglo-admin',
        );
    }

    public function parentLogin(LoginRequest $request): JsonResponse
    {
        return $this->authenticate(
            $request,
            ['parent'],
            'Akun ini tidak memiliki akses ke Portal Orang Tua.',
            'edglo-parent',
        );
    }

    /**
     * @param  array<int, string>  $allowedRoles
     */
    private function authenticate(
        LoginRequest $request,
        array $allowedRoles,
        string $forbiddenMessage,
        string $defaultDeviceName,
    ): JsonResponse {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! $user->is_active || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => ['Email atau password tidak sesuai.']]);
        }

        if (! in_array($user->role, $allowedRoles, true)) {
            return response()->json(['message' => $forbiddenMessage], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($request->string('device_name')->value() ?: $defaultDeviceName)->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'tokenType' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function updateProfile(Request $request): UserResource
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);
        $user->update($data);

        return new UserResource($user->fresh());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $request->user()->update(['password' => $data['password']]);
        $request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()?->id)->delete();

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }
}
