import { useState, type ReactNode } from 'react';
import type { Payment, Program, Student, Teacher } from '../types';
import { MONTH_NAMES, PAYMENTS, PROGRAMS, STUDENTS, TEACHERS, formatCurrency } from '../data/mockData';
import ProgramSummaryTable from '../components/reports/ProgramSummaryTable';
import { useToast } from '../components/ui/ToastProvider';
import DataPagination from '../components/ui/DataPagination';
import { DEFAULT_PDF_SETTINGS, printPdfReport, type PdfPrintSettings, type PdfReportType } from '../lib/pdfReports';

type ReportLog = { id: number; type: PdfReportType; period: string; createdAt: string; status: 'Siap'; month?: number; year?: number };
type PrintRequest = { type: PdfReportType; month: number; year: number; archive: boolean };
type Props = { students?: Student[]; teachers?: Teacher[]; programs?: Program[]; payments?: Payment[] };

const REPORTS: Array<{ type: PdfReportType; description: string; tone: string; icon: ReactNode }> = [
  { type: 'Data Murid', description: 'Daftar murid, orang tua, program, guru, status, dan jadwal belajar.', tone: 'teal', icon: 'MU' },
  { type: 'Data Guru', description: 'Profil guru, status kerja, kontak, serta ringkasan beban mengajar.', tone: 'blue', icon: 'GR' },
  { type: 'Keuangan Bulanan', description: 'Rincian tagihan, pembayaran, tunggakan, dan biaya tambahan.', tone: 'green', icon: 'BL' },
  { type: 'Keuangan Tahunan', description: 'Rekap pemasukan dan performa penagihan selama satu tahun.', tone: 'yellow', icon: 'TH' },
];

export default function Reports({ students = STUDENTS, teachers = TEACHERS, programs = PROGRAMS, payments = PAYMENTS }: Props) {
  const { notify } = useToast();
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [logs, setLogs] = useState<ReportLog[]>([
    { id: 1, type: 'Keuangan Bulanan', period: 'Juni 2026', createdAt: '30 Jul 2026, 16.10', status: 'Siap', month: 6, year: 2026 },
    { id: 2, type: 'Data Murid', period: 'Semua data', createdAt: '28 Jul 2026, 09.45', status: 'Siap' },
    { id: 3, type: 'Keuangan Tahunan', period: '2025', createdAt: '05 Jan 2026, 11.20', status: 'Siap', year: 2025 },
  ]);
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [printRequest, setPrintRequest] = useState<PrintRequest | null>(null);
  const [printSettings, setPrintSettings] = useState<PdfPrintSettings>(DEFAULT_PDF_SETTINGS);
  const activeStudents = students.filter((student) => student.status === 'active');
  const periodPayments = payments.filter((payment) => payment.month === month && payment.year === year);
  const paid = periodPayments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const outstanding = periodPayments.filter((payment) => payment.status !== 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const reportTotalPages = Math.max(1, Math.ceil(logs.length / reportPageSize));
  const safeReportPage = Math.min(reportPage, reportTotalPages);
  const reportPageStart = (safeReportPage - 1) * reportPageSize;
  const visibleLogs = logs.slice(reportPageStart, reportPageStart + reportPageSize);

  const openReport = (type: PdfReportType, reportMonth = month, reportYear = year, settings = printSettings) => {
    const opened = printPdfReport(type, { students, payments, teachers, programs, month: reportMonth, year: reportYear }, settings);
    notify(opened
      ? { tone: 'info', title: 'Dokumen PDF disiapkan', message: 'Pilih Save as PDF pada dialog cetak untuk menyimpan dokumen.' }
      : { tone: 'warning', title: 'Popup diblokir browser', message: 'Izinkan popup untuk situs ini, lalu coba cetak kembali.' });
    return opened;
  };

  const generateReport = (type: PdfReportType, reportMonth = month, reportYear = year) => {
    const period = type === 'Keuangan Bulanan' ? `${MONTH_NAMES[reportMonth - 1]} ${reportYear}` : type === 'Keuangan Tahunan' ? String(reportYear) : 'Semua data aktif';
    if (!openReport(type, reportMonth, reportYear)) return false;
    const createdAt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    setLogs((current) => [{ id: Math.max(0, ...current.map((item) => item.id)) + 1, type, period, createdAt, status: 'Siap', month: type === 'Keuangan Bulanan' ? reportMonth : undefined, year: type.includes('Keuangan') ? reportYear : undefined }, ...current]);
    return true;
  };

  const requestPrint = (type: PdfReportType, reportMonth = month, reportYear = year, archive = true) => {
    setPrintRequest({ type, month: reportMonth, year: reportYear, archive });
  };

  const confirmPrint = () => {
    if (!printRequest) return;
    const opened = printRequest.archive
      ? generateReport(printRequest.type, printRequest.month, printRequest.year)
      : openReport(printRequest.type, printRequest.month, printRequest.year);
    if (opened) setPrintRequest(null);
  };

  const printPeriod = printRequest
    ? printRequest.type === 'Keuangan Bulanan'
      ? `${MONTH_NAMES[printRequest.month - 1]} ${printRequest.year}`
      : printRequest.type === 'Keuangan Tahunan'
        ? String(printRequest.year)
        : 'Seluruh data'
    : '';

  return (
    <div className="reports-page">
      <div className="module-heading"><div><span className="eyebrow">PUSAT LAPORAN</span><h2>Buat dan arsipkan laporan</h2><p>Pilih jenis laporan, tentukan periode, lalu cetak atau simpan sebagai PDF.</p></div><div className="report-period"><select className="input-field" value={month} onChange={(event) => setMonth(Number(event.target.value))}>{MONTH_NAMES.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select><select className="input-field" value={year} onChange={(event) => setYear(Number(event.target.value))}>{[2024, 2025, 2026, 2027].map((item) => <option value={item} key={item}>{item}</option>)}</select></div></div>

      <div className="report-summary-grid">
        <div><span>Murid Aktif</span><strong>{activeStudents.length}</strong><small>{students.length} total terdaftar</small></div>
        <div><span>Guru Aktif</span><strong>{teachers.filter((teacher) => teacher.status === 'active').length}</strong><small>{teachers.length} total guru</small></div>
        <div><span>Diterima Bulan Ini</span><strong>{formatCurrency(paid)}</strong><small>{periodPayments.filter((payment) => payment.status === 'paid').length} pembayaran</small></div>
        <div><span>Piutang Bulan Ini</span><strong>{formatCurrency(outstanding)}</strong><small>{periodPayments.filter((payment) => payment.status !== 'paid').length} belum lunas</small></div>
      </div>

      <div className="report-card-grid">{REPORTS.map((report) => <article className={`report-action-card report-${report.tone}`} key={report.type}><span className="report-card-icon">{report.icon}</span><div><h3>{report.type}</h3><p>{report.description}</p></div><button type="button" className="btn-primary" onClick={() => requestPrint(report.type)}>Atur & Cetak</button></article>)}</div>

      <section className="report-section"><div className="section-heading"><div><span className="eyebrow">RINGKASAN PROGRAM</span><h3>Potensi pemasukan lembaga</h3></div></div><ProgramSummaryTable students={students} programs={programs} /></section>

      <section className="report-section"><div className="section-heading"><div><span className="eyebrow">RIWAYAT</span><h3>Laporan terbaru</h3></div><span>{logs.length} dokumen</span></div><div className="data-table-shell"><table className="data-table report-history-table"><thead><tr><th>Nama Laporan</th><th>Periode</th><th>Dibuat</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visibleLogs.map((log, rowIndex) => <tr key={log.id}><td><div className="numbered-report"><span className="table-row-number">{reportPageStart + rowIndex + 1}</span><div><strong>{log.type}</strong><small>EdGLO Admin Panel</small></div></div></td><td>{log.period}</td><td>{log.createdAt}</td><td><span className="badge badge-active">{log.status}</span></td><td><button type="button" className="btn-secondary btn-sm" onClick={() => requestPrint(log.type, log.month ?? month, log.year ?? year, false)}>Atur & Cetak</button></td></tr>)}</tbody></table></div><DataPagination totalItems={logs.length} page={safeReportPage} pageSize={reportPageSize} onPageChange={setReportPage} onPageSizeChange={(size) => { setReportPageSize(size); setReportPage(1); }} label="laporan" /></section>

      {printRequest && (
        <div className="modal-overlay">
          <div className="modal-box report-print-modal">
            <div className="report-print-header">
              <div><span className="eyebrow">PENGATURAN DOKUMEN</span><h2>{printRequest.type}</h2><p>Periode {printPeriod}</p></div>
              <button type="button" className="modal-x" onClick={() => setPrintRequest(null)} aria-label="Tutup">x</button>
            </div>

            <div className="report-print-layout">
              <div className="report-print-settings">
                <fieldset>
                  <legend>Ukuran Kertas</legend>
                  <div className="report-option-grid paper-options">
                    {(['A4', 'A3', 'Letter', 'Legal'] as PdfPrintSettings['paperSize'][]).map((paper) => <button type="button" className={printSettings.paperSize === paper ? 'active' : ''} onClick={() => setPrintSettings((current) => ({ ...current, paperSize: paper }))} key={paper}><strong>{paper}</strong><small>{paper === 'A4' ? '210 x 297 mm' : paper === 'A3' ? '297 x 420 mm' : paper === 'Letter' ? '216 x 279 mm' : '216 x 356 mm'}</small></button>)}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Orientasi</legend>
                  <div className="report-segmented">
                    <button type="button" className={printSettings.orientation === 'portrait' ? 'active' : ''} onClick={() => setPrintSettings((current) => ({ ...current, orientation: 'portrait' }))}><span className="orientation-icon portrait" />Portrait</button>
                    <button type="button" className={printSettings.orientation === 'landscape' ? 'active' : ''} onClick={() => setPrintSettings((current) => ({ ...current, orientation: 'landscape' }))}><span className="orientation-icon landscape" />Landscape</button>
                  </div>
                </fieldset>

                <div className="report-setting-row">
                  <div><label className="input-label">Margin</label><select className="input-field" value={printSettings.margin} onChange={(event) => setPrintSettings((current) => ({ ...current, margin: event.target.value as PdfPrintSettings['margin'] }))}><option value="narrow">Sempit</option><option value="normal">Normal</option><option value="wide">Lebar</option></select></div>
                  <div><label className="input-label">Kepadatan Tabel</label><select className="input-field" value={printSettings.density} onChange={(event) => setPrintSettings((current) => ({ ...current, density: event.target.value as PdfPrintSettings['density'] }))}><option value="compact">Ringkas</option><option value="comfortable">Nyaman</option></select></div>
                </div>

                <label className="report-signature-toggle"><input type="checkbox" checked={printSettings.showSignature} onChange={(event) => setPrintSettings((current) => ({ ...current, showSignature: event.target.checked }))} /><span><strong>Kolom tanda tangan</strong><small>Sertakan pengesahan Super Admin di akhir laporan</small></span></label>
                <label className="report-signature-toggle report-fit-toggle"><input type="checkbox" checked={printSettings.fitToPage ?? true} onChange={(event) => setPrintSettings((current) => ({ ...current, fitToPage: event.target.checked }))} /><span><strong>Sesuaikan ke satu lembar</strong><small>Jika hanya sedikit berlebih, ukuran laporan diperkecil otomatis agar tidak membuat lembar kedua</small></span></label>
              </div>

              <aside className="report-paper-preview">
                <div className={`paper-sheet ${printSettings.orientation} paper-${printSettings.paperSize.toLowerCase()} margin-${printSettings.margin}`}>
                  <div className="paper-preview-head"><span>EdGLO</span><i /></div>
                  <strong>{printRequest.type}</strong><small>{printPeriod}</small>
                  <div className="paper-preview-summary"><i /><i /><i /><i /></div>
                  <div className="paper-preview-table">{Array.from({ length: printSettings.density === 'compact' ? 8 : 6 }).map((_, index) => <i key={index} />)}</div>
                  {printSettings.showSignature && <div className="paper-preview-signature"><i /><span /></div>}
                </div>
                <div><strong>{printSettings.paperSize} {printSettings.orientation === 'landscape' ? 'Landscape' : 'Portrait'}</strong><span>Margin {printSettings.margin === 'narrow' ? 'sempit' : printSettings.margin === 'wide' ? 'lebar' : 'normal'} - tabel {printSettings.density === 'compact' ? 'ringkas' : 'nyaman'}{printSettings.fitToPage ? ' - auto fit' : ''}</span></div>
              </aside>
            </div>

            <div className="report-print-actions"><button type="button" className="btn-secondary" onClick={() => setPrintSettings(DEFAULT_PDF_SETTINGS)}>Reset</button><div><button type="button" className="btn-secondary" onClick={() => setPrintRequest(null)}>Batal</button><button type="button" className="btn-primary" onClick={confirmPrint}>Buka Pratinjau Cetak</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
