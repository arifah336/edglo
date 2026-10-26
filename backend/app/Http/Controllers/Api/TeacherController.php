<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherRequest;
use App\Http\Resources\TeacherResource;
use App\Models\Teacher;
use App\Models\User;
use App\Services\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TeacherController extends Controller
{
    public function __construct(private readonly IdGenerator $ids) {}

    public function index(Request $request)
    {
        $query = Teacher::query()->with(['statusHistories', 'user'])->withCount(['students' => fn ($builder) => $builder->where('status', 'active')]);
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($builder) => $builder->where('full_name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }
        foreach (['status', 'employment_type'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        $perPage = min(100, max(1, $request->integer('per_page', 10)));

        return TeacherResource::collection($query->orderBy('full_name')->paginate($perPage));
    }

    public function store(TeacherRequest $request): JsonResponse
    {
        $teacher = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $portalPassword = $data['portal_password'] ?? null;
            $portalEnabled = (bool) ($data['portal_enabled'] ?? false);
            unset($data['photo'], $data['portal_password'], $data['portal_enabled']);
            $data['id'] = $this->ids->next(Teacher::class, 'T', 3);
            $data['status'] = 'active';
            if ($request->hasFile('photo')) {
                $data['photo'] = $request->file('photo')->store('teachers', 'public');
            }
            $teacher = Teacher::create($data);
            $this->syncPortalAccount($teacher, $portalEnabled, $portalPassword);
            $teacher->statusHistories()->create([
                'date' => $teacher->join_date, 'action' => 'activated',
                'changed_by' => $request->user()->id, 'changed_by_name' => $request->user()->name,
            ]);

            return $teacher;
        });

        return (new TeacherResource($teacher->load(['statusHistories', 'user'])->loadCount('students')))->response()->setStatusCode(201);
    }

    public function show(Teacher $teacher): TeacherResource
    {
        return new TeacherResource($teacher->load(['statusHistories', 'user'])->loadCount('students'));
    }

    public function update(TeacherRequest $request, Teacher $teacher): TeacherResource
    {
        $data = $request->validated();
        $portalPassword = $data['portal_password'] ?? null;
        $portalEnabled = (bool) ($data['portal_enabled'] ?? $teacher->user?->is_active ?? false);
        unset($data['photo'], $data['portal_password'], $data['portal_enabled']);
        if ($request->hasFile('photo')) {
            if ($teacher->photo) {
                Storage::disk('public')->delete($teacher->photo);
            }
            $data['photo'] = $request->file('photo')->store('teachers', 'public');
        }
        $teacher->update($data);
        $this->syncPortalAccount($teacher, $portalEnabled, $portalPassword);

        return new TeacherResource($teacher->fresh()->load(['statusHistories', 'user'])->loadCount('students'));
    }

    public function deactivate(Request $request, Teacher $teacher): TeacherResource
    {
        $data = $request->validate(['date' => ['required', 'date'], 'reason' => ['required', 'string', 'max:1000']]);
        abort_if($teacher->status === 'off', 422, 'Guru sudah berstatus Off.');

        DB::transaction(function () use ($request, $teacher, $data) {
            $teacher->update(['status' => 'off', 'leave_date' => $data['date']]);
            $teacher->classSessions()->update(['is_active' => false]);
            $teacher->user?->update(['is_active' => false]);
            $teacher->statusHistories()->create([
                'date' => $data['date'], 'action' => 'deactivated', 'reason' => $data['reason'],
                'changed_by' => $request->user()->id, 'changed_by_name' => $request->user()->name,
            ]);
        });

        return new TeacherResource($teacher->fresh()->load(['statusHistories', 'user'])->loadCount('students'));
    }

    public function activate(Request $request, Teacher $teacher): TeacherResource
    {
        $data = $request->validate(['date' => ['required', 'date'], 'reason' => ['nullable', 'string', 'max:1000']]);
        abort_if($teacher->status === 'active', 422, 'Guru sudah aktif.');
        $teacher->update(['status' => 'active', 'leave_date' => null]);
        $teacher->user?->update(['is_active' => true]);
        $teacher->statusHistories()->create([
            'date' => $data['date'], 'action' => 'activated', 'reason' => $data['reason'] ?? null,
            'changed_by' => $request->user()->id, 'changed_by_name' => $request->user()->name,
        ]);

        return new TeacherResource($teacher->fresh()->load(['statusHistories', 'user'])->loadCount('students'));
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        abort_if($teacher->students()->exists() || $teacher->classSessions()->exists(), 409, 'Guru memiliki relasi murid atau kelas. Gunakan status Off.');
        if ($teacher->photo) {
            Storage::disk('public')->delete($teacher->photo);
        }
        $teacher->user?->delete();
        $teacher->delete();

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }

    private function syncPortalAccount(Teacher $teacher, bool $enabled, ?string $password): void
    {
        $user = $teacher->user;
        if (! $user && ! $enabled) {
            return;
        }

        if (! $user) {
            $user = User::create([
                'code' => $this->ids->next(User::class, 'G', 3, 'code'),
                'name' => $teacher->full_name,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'role' => 'teacher',
                'is_active' => true,
                'password' => $password,
            ]);
            $teacher->update(['user_id' => $user->id]);

            return;
        }

        $attributes = [
            'name' => $teacher->full_name,
            'email' => $teacher->email,
            'phone' => $teacher->phone,
            'is_active' => $enabled && $teacher->status === 'active',
        ];
        if ($password) {
            $attributes['password'] = $password;
        }
        $user->update($attributes);
    }
}
