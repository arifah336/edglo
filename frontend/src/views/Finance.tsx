import { useMemo, useState } from 'react';
import type { Payment, PaymentStatus, Program, Student } from '../types';
import { MONTH_NAMES, PAYMENTS, PROGRAMS, STUDENTS, TODAY, formatCurrency } from '../data/mockData';
import PaymentTable from '../components/finance/PaymentTable';
import InvoiceModal, { type NewInvoice } from '../components/finance/InvoiceModal';
import InvoiceDetailModal from '../components/finance/InvoiceDetailModal';
import YearlyOverview from '../components/finance/YearlyOverview';
import { useToast } from '../components/ui/ToastProvider';
import DataPagination from '../components/ui/DataPagination';
import { printInvoiceReport, printMonthlyFinanceReport, printYearlyFinanceReport } from '../lib/pdfReports';
import { getPaymentDueState } from '../lib/paymentDue';

type Props = { mode: 'monthly' | 'yearly'; students?: Student[]; programs?: Program[]; payments?: Payment[]; onPaymentsChange?: (payments: Payment[]) => void; canManage?: boolean };
const CURRENT_MONTH = 7;
const CURRENT_YEAR = 2026;
const PAYMENT_CLONE = PAYMENTS.map((payment) => ({ ...payment }));

function nextPaymentId(payments: Payment[]) {
  const largest = payments.reduce((max, payment) => Math.max(max, Number(payment.id.replace(/\D/g, '')) || 0), 0);
  return `PAY${String(largest + 1).padStart(4, '0')}`;
}

export default function Finance({ mode, students = STUDENTS, programs = PROGRAMS, payments: controlledPayments, onPaymentsChange, canManage = true }: Props) {
  const { notify } = useToast();
  const [fallbackPayments, setFallbackPayments] = useState(PAYMENT_CLONE);
  const payments = controlledPayments ?? fallbackPayments;
  const updatePayments = onPaymentsChange ?? setFallbackPayments;
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const filtered = useMemo(() => payments.filter((payment) => {
    if (mode === 'monthly' && (payment.month !== selectedMonth || payment.year !== selectedYear)) return false;
    if (mode === 'yearly' && payment.year !== selectedYear) return false;
    if (filterStatus !== 'all' && getPaymentDueState(payment, TODAY).status !== filterStatus) return false;
    const student = students.find((item) => item.id === payment.studentId);
    if (filterProgram !== 'all' && student?.programId !== filterProgram) return false;
    if (search && !student?.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filterProgram, filterStatus, mode, payments, search, selectedMonth, selectedYear, students]);

  const totalIncome = filtered.filter((payment) => getPaymentDueState(payment, TODAY).status === 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const totalBilled = filtered.reduce((sum, payment) => sum + payment.total, 0);
  const totalPending = filtered.filter((payment) => getPaymentDueState(payment, TODAY).status !== 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const overdueCount = filtered.filter((payment) => getPaymentDueState(payment, TODAY).status === 'overdue').length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visiblePayments = filtered.slice(pageStart, pageStart + pageSize);

  const createInvoice = (invoice: NewInvoice) => {
    const duplicate = payments.some((payment) => payment.studentId === invoice.studentId && payment.month === invoice.month && payment.year === invoice.year);
    if (duplicate) {
      notify({ tone: 'warning', title: 'Tagihan sudah tersedia', message: 'Murid tersebut sudah memiliki tagihan pada periode yang dipilih.' });
      return;
    }
    const next: Payment = { ...invoice, id: nextPaymentId(payments), status: invoice.dueDate < TODAY ? 'overdue' : 'pending' };
    updatePayments([next, ...payments]);
    setShowCreate(false);
    setSelectedMonth(invoice.month);
    setSelectedYear(invoice.year);
    setPage(1);
    notify({ tone: 'success', title: 'Tagihan berhasil dibuat', message: 'Tagihan baru sudah masuk ke daftar keuangan bulanan.' });
  };

  const markPaid = (payment: Payment) => {
    const next = payments.map((item) => item.id === payment.id ? { ...item, status: 'paid' as const, paidDate: TODAY } : item);
    updatePayments(next);
    setSelectedPayment((current) => current?.id === payment.id ? { ...payment, status: 'paid', paidDate: TODAY } : current);
    notify({ tone: 'success', title: 'Pembayaran diterima', message: `${formatCurrency(payment.total)} telah dicatat sebagai pemasukan.` });
  };

  const notifyPrintResult = (opened: boolean, label: string) => {
    notify(opened
      ? { tone: 'info', title: `${label} siap disimpan`, message: 'Pilih Save as PDF pada dialog cetak browser.' }
      : { tone: 'warning', title: 'Popup diblokir browser', message: 'Izinkan popup untuk situs ini, lalu coba kembali.' });
  };

  const printFinanceReport = () => {
    const opened = mode === 'monthly'
      ? printMonthlyFinanceReport(filtered, students, selectedMonth, selectedYear, undefined, programs)
      : printYearlyFinanceReport(filtered, selectedYear, undefined, programs);
    notifyPrintResult(opened, mode === 'monthly' ? 'Rekap bulanan' : 'Rekap tahunan');
  };

  const changeFilter = (callback: () => void) => { callback(); setPage(1); };

  return (
    <div className="finance-page">
      <div className="module-heading">
        <div><span className="eyebrow">{mode === 'monthly' ? 'OPERASIONAL TAGIHAN' : 'REKAP TAHUNAN'}</span><h2>{mode === 'monthly' ? 'Kelola tagihan dan pembayaran' : 'Analisis keuangan tahunan'}</h2><p>{mode === 'monthly' ? 'Pantau jatuh tempo otomatis dan catat pembayaran murid.' : 'Bandingkan nilai tagihan dan pemasukan setiap bulan.'}</p></div>
        <div className="module-actions"><button type="button" className="btn-secondary" onClick={printFinanceReport}>Cetak PDF</button>{mode === 'monthly' && canManage && <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>+ Buat Tagihan</button>}</div>
      </div>

      <div className="finance-summary-grid">
        {[{ label: 'Total Ditagihkan', value: formatCurrency(totalBilled), hint: `${filtered.length} tagihan`, tone: 'blue' }, { label: 'Sudah Diterima', value: formatCurrency(totalIncome), hint: totalBilled ? `${Math.round((totalIncome / totalBilled) * 100)}% tertagih` : '0% tertagih', tone: 'green' }, { label: 'Belum Terbayar', value: formatCurrency(totalPending), hint: `${filtered.filter((item) => getPaymentDueState(item, TODAY).status !== 'paid').length} tagihan`, tone: 'yellow' }, { label: 'Terlambat', value: String(overdueCount), hint: 'Dihitung otomatis dari jatuh tempo', tone: 'red' }].map((item) => <div className={`finance-summary-card tone-${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></div>)}
      </div>

      {mode === 'yearly' && <YearlyOverview payments={payments} year={selectedYear} />}

      <div className="finance-toolbar card">
        <div className="toolbar-search"><span>⌕</span><input value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder="Cari nama murid..." /></div>
        {mode === 'monthly' && <select className="input-field" value={selectedMonth} onChange={(event) => changeFilter(() => setSelectedMonth(Number(event.target.value)))}>{MONTH_NAMES.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select>}
        <select className="input-field" value={selectedYear} onChange={(event) => changeFilter(() => setSelectedYear(Number(event.target.value)))}>{[2024, 2025, 2026, 2027].map((year) => <option value={year} key={year}>{year}</option>)}</select>
        <select className="input-field" value={filterProgram} onChange={(event) => changeFilter(() => setFilterProgram(event.target.value))}><option value="all">Semua Program</option>{programs.map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select>
        <select className="input-field" value={filterStatus} onChange={(event) => changeFilter(() => setFilterStatus(event.target.value as 'all' | PaymentStatus))}><option value="all">Semua Status</option><option value="paid">Lunas</option><option value="pending">Menunggu</option><option value="overdue">Terlambat</option></select>
        <span className="toolbar-count">{filtered.length} data</span>
      </div>

      <PaymentTable payments={visiblePayments} students={students} programs={programs} mode={mode} onView={setSelectedPayment} onMarkPaid={markPaid} startIndex={pageStart} canManage={canManage} />
      <DataPagination totalItems={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="tagihan" />

      {showCreate && canManage && <InvoiceModal students={students} programs={programs} initialMonth={selectedMonth} initialYear={selectedYear} onClose={() => setShowCreate(false)} onCreate={createInvoice} />}
      {selectedPayment && <InvoiceDetailModal payment={selectedPayment} students={students} programs={programs} onClose={() => setSelectedPayment(null)} onPrint={() => notifyPrintResult(printInvoiceReport(selectedPayment, students, programs), 'Tagihan')} onMarkPaid={() => markPaid(selectedPayment)} canManage={canManage} />}
    </div>
  );
}
