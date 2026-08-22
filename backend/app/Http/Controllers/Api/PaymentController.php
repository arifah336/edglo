<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Student;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function index(Request $request)
    {
        Payment::where('status', 'pending')->whereDate('due_date', '<', today())->update(['status' => 'overdue']);
        $query = Payment::query()->with(['student.program', 'student.teacher', 'student.schedules']);
        foreach (['month', 'year', 'status', 'student_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        if ($request->filled('program_id')) {
            $query->whereHas('student', fn ($builder) => $builder->where('program_id', $request->input('program_id')));
        }
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('student', fn ($builder) => $builder->where('full_name', 'like', "%{$search}%"));
        }
        $perPage = min(100, max(1, $request->integer('per_page', 10)));

        return PaymentResource::collection($query->orderByDesc('due_date')->paginate($perPage));
    }

    public function summary(Request $request): JsonResponse
    {
        $query = Payment::query();
        if ($request->filled('month')) {
            $query->where('month', $request->integer('month'));
        }
        if ($request->filled('year')) {
            $query->where('year', $request->integer('year'));
        }
        $rows = $query->get();

        return response()->json(['data' => [
            'billed' => $rows->sum('total'),
            'received' => $rows->where('status', 'paid')->sum('total'),
            'outstanding' => $rows->whereIn('status', ['pending', 'overdue'])->sum('total'),
            'paidCount' => $rows->where('status', 'paid')->count(),
            'pendingCount' => $rows->where('status', 'pending')->count(),
            'overdueCount' => $rows->where('status', 'overdue')->count(),
        ]]);
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $student = Student::with('program')->findOrFail($request->input('student_id'));
        abort_if($student->payments()->where('month', $request->integer('month'))->where('year', $request->integer('year'))->exists(), 422, 'Tagihan periode tersebut sudah tersedia.');
        $payment = $this->payments->create($student, $request->validated(), $request->user()->id);

        return (new PaymentResource($payment->load(['student.program', 'student.teacher', 'student.schedules'])))->response()->setStatusCode(201);
    }

    public function show(Payment $payment): PaymentResource
    {
        return new PaymentResource($payment->load(['student.program', 'student.teacher', 'student.schedules', 'reminders']));
    }

    public function update(PaymentRequest $request, Payment $payment): PaymentResource
    {
        $data = $request->validated();
        $programFee = (int) ($data['program_fee'] ?? $payment->program_fee);
        $registrationFee = (int) ($data['registration_fee'] ?? $payment->registration_fee);
        $bookFee = (int) ($data['book_fee'] ?? $payment->book_fee);
        $data['total'] = $programFee + $registrationFee + $bookFee;
        if (($data['status'] ?? null) === 'paid' && empty($data['paid_date'])) {
            $data['paid_date'] = today();
        }
        $payment->update($data);

        return new PaymentResource($payment->fresh()->load(['student.program', 'student.teacher', 'student.schedules']));
    }

    public function markPaid(Request $request, Payment $payment): PaymentResource
    {
        $data = $request->validate(['paid_date' => ['nullable', 'date'], 'notes' => ['nullable', 'string', 'max:2000']]);
        $payment->update(['status' => 'paid', 'paid_date' => $data['paid_date'] ?? today(), 'notes' => $data['notes'] ?? $payment->notes]);
        $payment->reminders()->whereNull('sent_at')->update(['status' => 'cancelled']);

        return new PaymentResource($payment->fresh()->load(['student.program', 'student.teacher', 'student.schedules']));
    }

    public function sendReminder(Request $request, Payment $payment): JsonResponse
    {
        abort_if($payment->status === 'paid', 422, 'Tagihan sudah lunas.');
        $reminder = $payment->reminders()->create([
            'type' => $payment->status === 'overdue' ? 'overdue' : 'upcoming',
            'scheduled_for' => now(), 'sent_at' => now(), 'status' => 'sent', 'channel' => 'manual',
            'message' => $request->input('message', "Pengingat pembayaran {$payment->invoice_number}"),
        ]);

        return response()->json(['message' => 'Pengingat berhasil dicatat.', 'data' => $reminder]);
    }

    public function generateMonth(Request $request): JsonResponse
    {
        $data = $request->validate(['month' => ['required', 'integer', 'between:1,12'], 'year' => ['required', 'integer', 'between:2020,2100']]);
        $count = $this->payments->generateMonth($data['month'], $data['year'], $request->user()->id);

        return response()->json(['message' => "{$count} tagihan baru berhasil dibuat.", 'created' => $count]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        abort_if($payment->status === 'paid', 409, 'Tagihan lunas tidak dapat dihapus.');
        $payment->delete();

        return response()->json(['message' => 'Tagihan berhasil dihapus.']);
    }
}
