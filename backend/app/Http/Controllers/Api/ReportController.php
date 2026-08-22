<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Program;
use App\Models\Student;
use App\Models\Teacher;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year = $request->integer('year', now()->year);
        $payments = Payment::where('month', $month)->where('year', $year)->get();

        return response()->json(['data' => [
            'activeStudents' => Student::where('status', 'active')->count(),
            'totalStudents' => Student::count(),
            'activeTeachers' => Teacher::where('status', 'active')->count(),
            'totalTeachers' => Teacher::count(),
            'received' => $payments->where('status', 'paid')->sum('total'),
            'outstanding' => $payments->whereIn('status', ['pending', 'overdue'])->sum('total'),
            'programs' => Program::withCount(['activeStudents'])->get()->map(fn ($program) => [
                'id' => $program->id,
                'name' => $program->name,
                'price' => $program->price,
                'activeStudents' => $program->active_students_count,
                'potentialIncome' => $program->price * $program->active_students_count,
            ]),
        ]]);
    }

    public function download(Request $request)
    {
        $settings = $request->validate([
            'type' => ['required', Rule::in(['students', 'teachers', 'finance-monthly', 'finance-yearly'])],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'between:2020,2100'],
            'paper' => ['nullable', Rule::in(['a4', 'a5', 'letter', 'legal'])],
            'orientation' => ['nullable', Rule::in(['portrait', 'landscape'])],
            'show_signature' => ['nullable', 'boolean'],
        ]);
        $month = (int) ($settings['month'] ?? now()->month);
        $year = (int) ($settings['year'] ?? now()->year);
        $report = $this->reportData($settings['type'], $month, $year);
        $report['period'] = $settings['type'] === 'finance-monthly'
            ? sprintf('%02d/%d', $month, $year)
            : ($settings['type'] === 'finance-yearly' ? (string) $year : 'Seluruh data');
        $report['showSignature'] = (bool) ($settings['show_signature'] ?? true);
        $report['generatedBy'] = $request->user()->name;

        $pdf = Pdf::loadView('reports.standard', $report)
            ->setPaper($settings['paper'] ?? 'a4', $settings['orientation'] ?? 'portrait');

        return $pdf->download('EdGLO-'.str_replace('-', '-', $settings['type']).'-'.now()->format('Ymd-His').'.pdf');
    }

    private function reportData(string $type, int $month, int $year): array
    {
        if ($type === 'students') {
            $rows = Student::with(['program', 'teacher', 'schedules'])->orderBy('full_name')->get()->map(fn ($student) => [
                $student->id, $student->full_name, $student->parent_name, $student->program->name,
                $student->teacher?->full_name ?? '-', $student->phone, ucfirst($student->status),
            ]);

            return ['title' => 'Laporan Data Murid', 'columns' => ['ID', 'Nama Murid', 'Orang Tua', 'Program', 'Guru', 'Kontak', 'Status'], 'rows' => $rows];
        }

        if ($type === 'teachers') {
            $rows = Teacher::orderBy('full_name')->get()->map(fn ($teacher) => [
                $teacher->id, $teacher->full_name, $teacher->phone, $teacher->last_education,
                ucfirst($teacher->employment_type), $teacher->join_date->format('d/m/Y'), ucfirst($teacher->status),
            ]);

            return ['title' => 'Laporan Data Guru', 'columns' => ['ID', 'Nama Guru', 'Kontak', 'Pendidikan', 'Status Kerja', 'Tgl Masuk', 'Status'], 'rows' => $rows];
        }

        if ($type === 'finance-monthly') {
            $rows = Payment::with('student.program')->where('month', $month)->where('year', $year)->orderBy('due_date')->get()->map(fn ($payment) => [
                $payment->invoice_number, $payment->student->full_name, $payment->student->program->name,
                $payment->due_date->format('d/m/Y'), 'Rp '.number_format($payment->total, 0, ',', '.'), ucfirst($payment->status),
            ]);

            return ['title' => 'Laporan Keuangan Bulanan', 'columns' => ['No. Tagihan', 'Murid', 'Program', 'Jatuh Tempo', 'Total', 'Status'], 'rows' => $rows];
        }

        $payments = Payment::where('year', $year)->get();
        $rows = collect(range(1, 12))->map(function ($monthNumber) use ($payments) {
            $monthRows = $payments->where('month', $monthNumber);

            return [
                $this->monthName($monthNumber),
                (string) $monthRows->count(),
                'Rp '.number_format($monthRows->where('status', 'paid')->sum('total'), 0, ',', '.'),
                'Rp '.number_format($monthRows->whereIn('status', ['pending', 'overdue'])->sum('total'), 0, ',', '.'),
            ];
        });

        return ['title' => 'Laporan Keuangan Tahunan', 'columns' => ['Bulan', 'Jumlah Tagihan', 'Diterima', 'Piutang'], 'rows' => $rows];
    }

    private function monthName(int $month): string
    {
        return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][$month - 1];
    }
}
