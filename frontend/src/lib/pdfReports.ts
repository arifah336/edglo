import type { Payment, Program, Student, Teacher } from '../types';
import { MONTH_NAMES, PROGRAMS, TEACHERS, formatCurrency, formatDate } from '../data/mockData';

export type PdfReportType = 'Data Murid' | 'Data Guru' | 'Keuangan Bulanan' | 'Keuangan Tahunan';

export type PdfPrintSettings = {
  paperSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: 'narrow' | 'normal' | 'wide';
  density: 'compact' | 'comfortable';
  showSignature: boolean;
  fitToPage: boolean;
};

export const DEFAULT_PDF_SETTINGS: PdfPrintSettings = {
  paperSize: 'A4',
  orientation: 'landscape',
  margin: 'normal',
  density: 'compact',
  showSignature: true,
  fitToPage: true,
};

type ReportOptions = {
  title: string;
  subtitle: string;
  period: string;
  documentCode: string;
  summary: Array<{ label: string; value: string; note?: string }>;
  table: string;
  orientation?: 'portrait' | 'landscape';
  printSettings?: Partial<PdfPrintSettings>;
  notes?: string;
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const statusLabel = (status: Payment['status']) => status === 'paid' ? 'Lunas' : status === 'overdue' ? 'Terlambat' : 'Menunggu';
const paymentStatusClass = (status: Payment['status']) => status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning';

function reportNumber(prefix: string) {
  const now = new Date();
  return `${prefix}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}/${String(now.getTime()).slice(-6)}`;
}

function reportTable(headers: string[], rows: string[][], alignRight: number[] = []) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((header, index) => `<th class="${alignRight.includes(index) ? 'right' : ''}">${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${row.map((cell, index) => `<td class="${alignRight.includes(index) ? 'right' : ''}">${cell}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="empty">Tidak ada data pada periode ini.</td></tr>`}</tbody></table></div>`;
}

function openPrintWindow(options: ReportOptions) {
  const printWindow = window.open('', '_blank', 'width=1180,height=820');
  if (!printWindow) return false;
  const settings: PdfPrintSettings = {
    ...DEFAULT_PDF_SETTINGS,
    ...options.printSettings,
    orientation: options.printSettings?.orientation ?? options.orientation ?? DEFAULT_PDF_SETTINGS.orientation,
    fitToPage: options.printSettings?.fitToPage ?? DEFAULT_PDF_SETTINGS.fitToPage,
  };
  const pageMargins = {
    narrow: '8mm 8mm 11mm',
    normal: '14mm 12mm 16mm',
    wide: '20mm 18mm 22mm',
  }[settings.margin];
  const bodyFontSize = settings.density === 'compact' ? '8.4px' : '9.2px';
  const tableFontSize = settings.density === 'compact' ? '6.9px' : '7.7px';
  const tableCellPadding = settings.density === 'compact' ? '5px 5px' : '7px 6px';
  const approvalMargin = settings.density === 'compact' ? '12px' : '18px';
  const signatureHeight = settings.density === 'compact' ? '36px' : '48px';
  const generatedAt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  const logoUrl = `${window.location.origin}/edglo-logo.png`;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.title)} - EdGLO</title><style>
    @page { size: ${settings.paperSize} ${settings.orientation}; margin: ${pageMargins}; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #18313C; background: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: ${bodyFontSize}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { padding: 0; overflow: visible; }
    .report { width: calc(100% - 1px); max-width: 100%; overflow: visible; }
    .header { display: grid; grid-template-columns: 155px 1fr auto; align-items: center; gap: 18px; padding-bottom: 12px; border-bottom: 3px solid #1687A7; }
    .logo { width: 142px; height: 56px; object-fit: cover; object-position: center 44%; }
    .header-copy { padding-left: 17px; border-left: 1px solid #DDE7EA; }
    .header-copy small { color: #1687A7; font-size: 8px; font-weight: 800; letter-spacing: .12em; }
    .header-copy h1 { margin: 4px 0 3px; color: #173540; font-size: 19px; line-height: 1.1; }
    .header-copy p { margin: 0; color: #6E828C; font-size: 9px; }
    .document-meta { min-width: 190px; text-align: right; }
    .document-meta span, .document-meta strong { display: block; }
    .document-meta span { color: #80919A; font-size: 7px; font-weight: 700; text-transform: uppercase; }
    .document-meta strong { margin: 3px 0 7px; color: #29434E; font-size: 9px; }
    .period-strip { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 11px 0; padding: 9px 11px; border: 1px solid #D9E6EA; border-radius: 5px; background: #F4F9FA; }
    .period-strip div { display: flex; align-items: baseline; gap: 7px; }
    .period-strip span { color: #778B94; font-size: 7px; font-weight: 800; text-transform: uppercase; }
    .period-strip strong { color: #173E4C; font-size: 11px; }
    .period-strip small { color: #7D8F97; font-size: 7px; }
    .summary { display: grid; grid-template-columns: repeat(${Math.max(options.summary.length, 1)}, minmax(0, 1fr)); gap: 7px; margin-bottom: 11px; }
    .summary-card { min-height: 58px; padding: 9px 10px; border: 1px solid #DDE7EA; border-top: 3px solid #1687A7; border-radius: 5px; background: #FFFFFF; }
    .summary-card span, .summary-card strong, .summary-card small { display: block; }
    .summary-card span { color: #748891; font-size: 7px; font-weight: 800; text-transform: uppercase; }
    .summary-card strong { margin-top: 5px; color: #173540; font-size: 14px; }
    .summary-card small { margin-top: 3px; color: #8C9AA0; font-size: 7px; }
    .section-title { display: flex; align-items: center; justify-content: space-between; margin: 12px 0 6px; }
    .section-title h2 { margin: 0; color: #29434E; font-size: 11px; }
    .section-title span { color: #7E9098; font-size: 7px; }
    .table-wrap { overflow: hidden; border: 1px solid #DCE6EA; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th { padding: ${tableCellPadding}; border-bottom: 1px solid #C9DADF; background: #EAF4F6; color: #506B76; font-size: ${tableFontSize}; font-weight: 800; text-align: left; text-transform: uppercase; }
    td { padding: ${tableCellPadding}; border-bottom: 1px solid #E8EEF0; color: #425C67; font-size: ${tableFontSize}; line-height: 1.35; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #FAFCFD; }
    tbody tr:last-child td { border-bottom: 0; }
    th.right, td.right { text-align: right; white-space: nowrap; }
    td strong { color: #203D49; font-size: 7.4px; }
    td small { display: block; margin-top: 2px; color: #819199; font-size: 6.5px; }
    .status { display: inline-block; padding: 3px 6px; border-radius: 10px; font-size: 6.5px; font-weight: 800; }
    .status.success { color: #16795B; background: #E5F5EF; }
    .status.warning { color: #94620A; background: #FFF2D5; }
    .status.danger { color: #BB3E4D; background: #FCE8EB; }
    .empty { height: 70px; color: #7C8E96; text-align: center; vertical-align: middle; }
    .report-note { margin-top: 10px; padding: 8px 10px; border-left: 3px solid #D6A322; background: #FFF9E9; color: #726333; font-size: 7px; line-height: 1.5; }
    .approval { display: grid; grid-template-columns: 1fr 200px; gap: 36px; margin-top: ${approvalMargin}; break-inside: avoid; page-break-inside: avoid; }
    .approval-note { color: #7C8D95; font-size: 7px; line-height: 1.5; }
    .signature { text-align: center; }
    .signature span, .signature strong, .signature small { display: block; }
    .signature span { color: #617883; font-size: 8px; }
    .signature-space { height: ${signatureHeight}; }
    .signature strong { padding-top: 5px; border-top: 1px solid #67808A; color: #29434E; font-size: 8px; }
    .signature small { margin-top: 2px; color: #85949B; font-size: 7px; }
    .footer { position: static; display: flex; justify-content: space-between; margin-top: 12px; padding-top: 5px; border-top: 1px solid #DCE6EA; color: #88979E; font-size: 6.5px; break-inside: avoid; page-break-inside: avoid; }
    .invoice-hero { display: grid; grid-template-columns: 1fr auto; gap: 20px; margin: 14px 0; padding: 14px; border-radius: 6px; background: #F0F8FA; }
    .invoice-hero span, .invoice-hero strong, .invoice-hero small { display: block; }
    .invoice-hero span { color: #738891; font-size: 7px; font-weight: 800; text-transform: uppercase; }
    .invoice-hero strong { margin: 5px 0 3px; color: #173B48; font-size: 15px; }
    .invoice-total { text-align: right; }
    .invoice-total strong { color: #087E9E; font-size: 19px; }
    .invoice-lines { margin: 10px 0; border: 1px solid #DDE7EA; border-radius: 5px; }
    .invoice-line { display: flex; justify-content: space-between; gap: 20px; padding: 9px 11px; border-bottom: 1px solid #E7EDF0; }
    .invoice-line:last-child { border: 0; }
    .invoice-line.total { background: #F4F9FA; font-size: 11px; font-weight: 800; }
    @media print { .no-print { display: none !important; } }
  </style></head><body><main class="report">
    <header class="header"><img class="logo" src="${logoUrl}" alt="EdGLO"><div class="header-copy"><small>EDGLO LEARNING CENTER</small><h1>${escapeHtml(options.title)}</h1><p>${escapeHtml(options.subtitle)}</p></div><div class="document-meta"><span>Nomor Dokumen</span><strong>${escapeHtml(options.documentCode)}</strong><span>Dibuat</span><strong>${escapeHtml(generatedAt)}</strong></div></header>
    <div class="period-strip"><div><span>Periode</span><strong>${escapeHtml(options.period)}</strong></div><small>${settings.paperSize} ${settings.orientation === 'landscape' ? 'Landscape' : 'Portrait'} | Dicetak dari EdGLO Admin Panel</small></div>
    ${options.summary.length ? `<section class="summary">${options.summary.map((item) => `<article class="summary-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</article>`).join('')}</section>` : ''}
    ${options.table}
    ${options.notes ? `<div class="report-note">${escapeHtml(options.notes)}</div>` : ''}
    ${settings.showSignature ? '<section class="approval"><p class="approval-note">Dokumen ini dibuat melalui sistem administrasi EdGLO. Data pada laporan merupakan kondisi saat dokumen dicetak dan digunakan untuk kebutuhan administrasi internal lembaga.</p><div class="signature"><span>Mengetahui,</span><div class="signature-space"></div><strong>Super Admin EdGLO</strong><small>Penanggung Jawab</small></div></section>' : ''}
    <footer class="footer"><span>EdGLO - Learn Do Repeat</span><span>${escapeHtml(options.title)} | ${escapeHtml(options.period)}</span></footer>
  </main><script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        var shouldFit = ${settings.fitToPage ? 'true' : 'false'};
        var report = document.querySelector('.report');
        if (shouldFit && report) {
          var sizes = { A4: [210, 297], A3: [297, 420], Letter: [215.9, 279.4], Legal: [215.9, 355.6] };
          var paper = sizes['${settings.paperSize}'];
          var pageHeight = '${settings.orientation}' === 'landscape' ? paper[0] : paper[1];
          var margins = { narrow: [8, 8, 11], normal: [14, 12, 16], wide: [20, 18, 22] }['${settings.margin}'];
          var pxPerMm = 96 / 25.4;
          var printableHeight = (pageHeight - margins[0] - margins[2]) * pxPerMm;
          var naturalHeight = report.scrollHeight;
          var fitScale = Math.min(printableHeight / naturalHeight, 1);
          if (fitScale < 1 && fitScale >= 0.76) {
            report.style.zoom = String(Math.max(fitScale - 0.015, 0.76));
            document.body.classList.add('fitted-single-page');
          }
        }
        window.focus();
        window.print();
      }, 500);
    });
  </script></body></html>`);
  printWindow.document.close();
  return true;
}

export function printStudentReport(students: Student[], printSettings?: Partial<PdfPrintSettings>, programs: Program[] = PROGRAMS, teachers: Teacher[] = TEACHERS) {
  const rows = students.map((student, index) => {
    const program = programs.find((item) => item.id === student.programId);
    const teacher = teachers.find((item) => item.id === student.teacherId);
    const schedules = student.schedules.map((schedule) => `${schedule.day.slice(0, 3)} ${schedule.time}`).join(', ') || '-';
    return [String(index + 1), `<strong>${escapeHtml(student.fullName)}</strong><small>${escapeHtml(student.id)}</small>`, escapeHtml(student.parentName), `<strong>${escapeHtml(program?.name ?? '-')}</strong><small>${formatCurrency(program?.price ?? 0)}/bulan</small>`, escapeHtml(teacher?.fullName ?? '-'), escapeHtml(student.phone), escapeHtml(schedules), escapeHtml(formatDate(student.joinDate)), `<span class="status ${student.status === 'active' ? 'success' : 'danger'}">${student.status === 'active' ? 'Aktif' : 'Off'}</span>`];
  });
  return openPrintWindow({ title: 'Laporan Data Murid', subtitle: 'Daftar murid, program, guru, dan jadwal belajar', period: 'Seluruh data', documentCode: reportNumber('EDGLO/MRD'), summary: [{ label: 'Total Murid', value: String(students.length) }, { label: 'Murid Aktif', value: String(students.filter((item) => item.status === 'active').length) }, { label: 'Murid Off', value: String(students.filter((item) => item.status === 'off').length) }, { label: 'Program Aktif', value: String(new Set(students.filter((item) => item.status === 'active').map((item) => item.programId)).size) }], table: `<div class="section-title"><h2>Daftar Murid</h2><span>${students.length} data</span></div>${reportTable(['No.', 'Murid', 'Orang Tua', 'Program', 'Guru', 'Telepon', 'Jadwal', 'Tgl Masuk', 'Status'], rows)}`, printSettings });
}

export function printTeacherReport(teachers: Teacher[], printSettings?: Partial<PdfPrintSettings>) {
  const rows = teachers.map((teacher, index) => [String(index + 1), `<strong>${escapeHtml(teacher.fullName)}</strong><small>${escapeHtml(teacher.id)}</small>`, `<strong>${escapeHtml(teacher.phone)}</strong><small>${escapeHtml(teacher.email)}</small>`, escapeHtml(teacher.lastEducation), escapeHtml(teacher.employmentType === 'fulltime' ? 'Fulltime' : teacher.employmentType === 'parttime' ? 'Part Time' : 'Magang'), escapeHtml(formatDate(teacher.joinDate)), escapeHtml(teacher.leaveDate ? formatDate(teacher.leaveDate) : '-'), `<span class="status ${teacher.status === 'active' ? 'success' : 'danger'}">${teacher.status === 'active' ? 'Aktif' : 'Off'}</span>`]);
  return openPrintWindow({ title: 'Laporan Data Guru', subtitle: 'Profil dan status tenaga pengajar EdGLO', period: 'Seluruh data', documentCode: reportNumber('EDGLO/GRU'), summary: [{ label: 'Total Guru', value: String(teachers.length) }, { label: 'Guru Aktif', value: String(teachers.filter((item) => item.status === 'active').length) }, { label: 'Fulltime', value: String(teachers.filter((item) => item.status === 'active' && item.employmentType === 'fulltime').length) }, { label: 'Part Time & Magang', value: String(teachers.filter((item) => item.status === 'active' && item.employmentType !== 'fulltime').length) }], table: `<div class="section-title"><h2>Daftar Guru</h2><span>${teachers.length} data</span></div>${reportTable(['No.', 'Guru', 'Kontak', 'Pendidikan', 'Status Kerja', 'Tgl Masuk', 'Tgl Off', 'Status'], rows)}`, printSettings });
}

export function printMonthlyFinanceReport(payments: Payment[], students: Student[], month: number, year: number, printSettings?: Partial<PdfPrintSettings>, programs: Program[] = PROGRAMS) {
  const selected = payments.filter((payment) => payment.month === month && payment.year === year);
  const billed = selected.reduce((sum, item) => sum + item.total, 0);
  const paid = selected.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.total, 0);
  const rows = selected.map((payment, index) => {
    const student = students.find((item) => item.id === payment.studentId);
    const program = student ? programs.find((item) => item.id === student.programId) : undefined;
    return [String(index + 1), `<strong>${escapeHtml(student?.fullName ?? '-')}</strong><small>${escapeHtml(student?.parentName ?? '-')}</small>`, escapeHtml(program?.name ?? '-'), escapeHtml(formatDate(payment.dueDate)), formatCurrency(payment.programFee), payment.registrationFee ? formatCurrency(payment.registrationFee) : '-', payment.bookFee ? formatCurrency(payment.bookFee) : '-', `<strong>${formatCurrency(payment.total)}</strong>`, `<span class="status ${paymentStatusClass(payment.status)}">${statusLabel(payment.status)}</span>`];
  });
  return openPrintWindow({ title: 'Rekap Keuangan Bulanan', subtitle: 'Rincian tagihan dan penerimaan murid', period: `${MONTH_NAMES[month - 1]} ${year}`, documentCode: reportNumber('EDGLO/KEU-BLN'), summary: [{ label: 'Total Tagihan', value: formatCurrency(billed), note: `${selected.length} tagihan` }, { label: 'Sudah Diterima', value: formatCurrency(paid), note: `${selected.filter((item) => item.status === 'paid').length} lunas` }, { label: 'Piutang', value: formatCurrency(billed - paid), note: `${selected.filter((item) => item.status !== 'paid').length} belum lunas` }, { label: 'Tingkat Tertagih', value: `${billed ? Math.round((paid / billed) * 100) : 0}%` }], table: `<div class="section-title"><h2>Rincian Keuangan</h2><span>${selected.length} transaksi</span></div>${reportTable(['No.', 'Murid', 'Program', 'Jatuh Tempo', 'Les', 'Daftar', 'Buku', 'Total', 'Status'], rows, [4, 5, 6, 7])}`, notes: 'Tagihan berstatus menunggu atau terlambat dicatat sebagai piutang sampai pembayaran diterima.', printSettings });
}

export function printYearlyFinanceReport(payments: Payment[], year: number, printSettings?: Partial<PdfPrintSettings>, programs: Program[] = PROGRAMS) {
  const yearPayments = payments.filter((payment) => payment.year === year);
  const rows = MONTH_NAMES.map((name, index) => {
    const monthPayments = yearPayments.filter((payment) => payment.month === index + 1);
    const billed = monthPayments.reduce((sum, item) => sum + item.total, 0);
    const paid = monthPayments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.total, 0);
    return [String(index + 1), `<strong>${escapeHtml(name)}</strong>`, String(monthPayments.length), formatCurrency(billed), formatCurrency(paid), formatCurrency(billed - paid), `${billed ? Math.round((paid / billed) * 100) : 0}%`];
  });
  const billed = yearPayments.reduce((sum, item) => sum + item.total, 0);
  const paid = yearPayments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.total, 0);
  const activePrograms = programs.filter((program) => yearPayments.some((payment) => payment.programFee === program.price)).length;
  return openPrintWindow({ title: 'Rekap Keuangan Tahunan', subtitle: 'Performa tagihan dan penerimaan per bulan', period: String(year), documentCode: reportNumber('EDGLO/KEU-THN'), summary: [{ label: 'Total Ditagihkan', value: formatCurrency(billed), note: `${yearPayments.length} tagihan` }, { label: 'Total Diterima', value: formatCurrency(paid) }, { label: 'Total Piutang', value: formatCurrency(billed - paid) }, { label: 'Program Tercatat', value: String(activePrograms) }], table: `<div class="section-title"><h2>Rekap Bulanan</h2><span>Januari - Desember ${year}</span></div>${reportTable(['No.', 'Bulan', 'Tagihan', 'Ditagihkan', 'Diterima', 'Piutang', 'Tertagih'], rows, [2, 3, 4, 5, 6])}`, printSettings });
}

export function printInvoiceReport(payment: Payment, students: Student[], programs: Program[] = PROGRAMS) {
  const student = students.find((item) => item.id === payment.studentId);
  const program = student ? programs.find((item) => item.id === student.programId) : undefined;
  const lines = [`<div class="invoice-line"><span>Biaya ${escapeHtml(program?.name ?? 'program')}</span><strong>${formatCurrency(payment.programFee)}</strong></div>`, payment.registrationFee ? `<div class="invoice-line"><span>Biaya pendaftaran</span><strong>${formatCurrency(payment.registrationFee)}</strong></div>` : '', payment.bookFee ? `<div class="invoice-line"><span>Biaya buku</span><strong>${formatCurrency(payment.bookFee)}</strong></div>` : '', `<div class="invoice-line total"><span>Total Tagihan</span><strong>${formatCurrency(payment.total)}</strong></div>`].join('');
  return openPrintWindow({ title: 'Tagihan Pembayaran', subtitle: `Nomor ${escapeHtml(payment.id)}`, period: `${MONTH_NAMES[payment.month - 1]} ${payment.year}`, documentCode: reportNumber('EDGLO/INV'), orientation: 'portrait', summary: [], table: `<section class="invoice-hero"><div><span>Ditagihkan Kepada</span><strong>${escapeHtml(student?.fullName ?? '-')}</strong><small>Orang tua: ${escapeHtml(student?.parentName ?? '-')} | ${escapeHtml(student?.phone ?? '-')}</small></div><div class="invoice-total"><span>Status</span><strong>${statusLabel(payment.status)}</strong><small>Jatuh tempo ${escapeHtml(formatDate(payment.dueDate))}</small></div></section><div class="invoice-lines">${lines}</div><div class="period-strip"><div><span>Program</span><strong>${escapeHtml(program?.name ?? '-')}</strong></div><small>${payment.paidDate ? `Dibayar ${escapeHtml(formatDate(payment.paidDate))}` : 'Belum tercatat sebagai lunas'}</small></div>`, notes: payment.notes || 'Pembayaran dicatat secara manual oleh admin EdGLO.' });
}

export function printPdfReport(type: PdfReportType, data: { students: Student[]; payments: Payment[]; teachers?: Teacher[]; programs?: Program[]; month: number; year: number }, printSettings?: Partial<PdfPrintSettings>) {
  if (type === 'Data Murid') return printStudentReport(data.students, printSettings, data.programs ?? PROGRAMS, data.teachers ?? TEACHERS);
  if (type === 'Data Guru') return printTeacherReport(data.teachers ?? TEACHERS, printSettings);
  if (type === 'Keuangan Bulanan') return printMonthlyFinanceReport(data.payments, data.students, data.month, data.year, printSettings, data.programs ?? PROGRAMS);
  return printYearlyFinanceReport(data.payments, data.year, printSettings, data.programs ?? PROGRAMS);
}
