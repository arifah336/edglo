<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function index(Request $request)
    {
        $query = User::query()->latest();
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($builder) => $builder->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return UserResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function store(AdminRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['password_confirmation']);
        $data['code'] = $this->ids->next(User::class, 'A', 3, 'code');
        $admin = User::create($data);

        return (new UserResource($admin))->response()->setStatusCode(201);
    }

    public function show(User $admin): UserResource
    {
        return new UserResource($admin);
    }

    public function update(AdminRequest $request, User $admin): UserResource
    {
        $data = $request->validated();
        unset($data['password_confirmation']);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $admin->update($data);

        return new UserResource($admin->fresh());
    }

    public function destroy(Request $request, User $admin): JsonResponse
    {
        abort_if($request->user()->is($admin), 422, 'Akun yang sedang dipakai tidak dapat dihapus.');
        abort_if($admin->isSuperAdmin() && User::where('role', 'super_admin')->where('is_active', true)->count() <= 1, 422, 'Minimal satu Super Admin aktif harus tersedia.');
        $admin->tokens()->delete();
        $admin->delete();

        return response()->json(['message' => 'Admin berhasil dihapus.']);
    }
}
