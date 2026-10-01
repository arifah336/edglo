'use client';

import { useState } from 'react';
import { Banknote, FileText, Pencil, UsersRound, X } from 'lucide-react';
import type { Teacher, TeacherAttendance, TeacherPayroll } from '../types';
import { formatCurrency } from '../data/mockData';
import { useToast } from '../components/ui/ToastProvider';

type Props = {
  teachers: Teacher[];
  attendances: TeacherAttendance[];
  payrolls: TeacherPayroll[];
  onSave: (data: Partial<TeacherPayroll>) => Promise<void>;
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function printSlip(payroll: TeacherPayroll, teacher: Teacher) {
  const popup = window.open('', '_blank', 'width=820,height=920');
  if (!popup) return false;
  popup.document.write(`<!doctype html><html><head><title>Slip Gaji ${teacher.fullName}</title><style>body{font-family:Arial,sans-serif;color:#17252b;padding:42px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #1595ad;padding-bottom:18px}h1{font-size:22px;margin:0}.muted{color:#657780;font-size:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}.box{border:1px solid #dce7ea;padding:14px}.row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #e7eef0}.total{font-size:18px;font-weight:800;border-top:2px solid #17252b;margin-top:10px}.sign{margin-top:70px;text-align:right}.line{display:inline-block;width:220px;border-top:1px solid #17252b;padding-top:8px;margin-top:55px}@media print{button{display:none}}</style></head><body><div class="head"><div><h1>EdGLO Learning Center</h1><div class="muted">Slip Gaji Guru</div></div><div><strong>${MONTHS[payroll.month - 1]} ${payroll.year}</strong><div class="muted">${payroll.id}</div></div></div><div class="meta"><div class="box"><div class="muted">Nama Guru</div><strong>${teacher.fullName}</strong></div><div class="box"><div class="muted">Tipe Kerja</div><strong>${teacher.employmentType}</strong></div></div><div class="row"><span>Gaji pokok</span><strong>${formatCurrency(payroll.baseSalary)}</strong></div><div class="row"><span>${payroll.attendanceCount} sesi x ${formatCurrency(payroll.ratePerSession)}</span><strong>${formatCurrency(payroll.attendanceCount * payroll.ratePerSession)}</strong></div><div class="row"><span>Tunjangan</span><strong>${formatCurrency(payroll.allowance)}</strong></div><div class="row"><span>Potongan</span><strong>- ${formatCurrency(payroll.deduction)}</strong></div><div class="row total"><span>Total diterima</span><strong>${formatCurrency(payroll.total)}</strong></div><div class="muted" style="margin-top:16px">${payroll.notes ?? ''}</div><div class="sign"><div>Batam, ${new Date().toLocaleDateString('id-ID')}</div><div class="line">Super Admin (Owner)</div></div><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
  return true;
}

export default function Payroll({ teachers, attendances, payrolls, onSave }: Props) {
  const { notify } = useToast();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ baseSalary: 0, ratePerSession: 75000, allowance: 0, deduction: 0, status: 'draft' as TeacherPayroll['status'], notes: '' });
  const periodPayrolls = payrolls.filter((item) => item.month === month && item.year === year);
  const totalPayroll = periodPayrolls.reduce((sum, item) => sum + item.total, 0);
  const totalSessions = periodPayrolls.reduce((sum, item) => sum + item.attendanceCount, 0);
  const attendanceCount = (teacherId: string) => attendances.filter((item) => item.teacherId === teacherId && item.status === 'present' && new Date(`${item.attendanceDate}T00:00:00`).getMonth() + 1 === month && new Date(`${item.attendanceDate}T00:00:00`).getFullYear() === year).length;
  const openEditor = (teacher: Teacher) => {
    const payroll = periodPayrolls.find((item) => item.teacherId === teacher.id);
    setEditing(teacher);
    setForm(payroll ? { baseSalary: payroll.baseSalary, ratePerSession: payroll.ratePerSession, allowance: payroll.allowance, deduction: payroll.deduction, status: payroll.status, notes: payroll.notes ?? '' } : { baseSalary: teacher.employmentType === 'fulltime' ? 2500000 : 0, ratePerSession: 75000, allowance: 0, deduction: 0, status: 'draft', notes: '' });
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await onSave({ teacherId: editing.id, month, year, ...form });
      notify({ tone: 'success', title: 'Slip gaji tersimpan', message: `${editing.fullName} berhasil dihitung dari absensi bulan ini.` });
      setEditing(null);
    } catch (error) {
      notify({ tone: 'error', title: 'Slip gagal disimpan', message: error instanceof Error ? error.message : 'Permintaan gagal.' });
    } finally { setSaving(false); }
  };

  return <div className="payroll-page">
    <div className="module-heading"><div><span className="eyebrow">PENGGAJIAN GURU</span><h2>Slip gaji berbasis kehadiran</h2><p>Jumlah sesi diambil dari absensi yang dicatat Admin dan nominal ditetapkan Owner.</p></div><div className="period-controls"><select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{MONTHS.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select><select value={year} onChange={(event) => setYear(Number(event.target.value))}>{[2025, 2026, 2027].map((item) => <option key={item}>{item}</option>)}</select></div></div>
    <div className="payroll-summary-grid"><article><Banknote size={20} /><span>Total penggajian</span><strong>{formatCurrency(totalPayroll)}</strong><small>{MONTHS[month - 1]} {year}</small></article><article><UsersRound size={20} /><span>Guru dihitung</span><strong>{periodPayrolls.length}</strong><small>dari {teachers.length} guru</small></article><article><FileText size={20} /><span>Total sesi hadir</span><strong>{totalSessions}</strong><small>Dasar honor mengajar</small></article></div>
    <section className="operation-panel"><div className="data-table-wrap"><table className="operation-table payroll-table"><thead><tr><th>No.</th><th>Guru</th><th>Tipe</th><th>Sesi hadir</th><th>Gaji pokok</th><th>Honor sesi</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{teachers.map((teacher, index) => { const payroll = periodPayrolls.find((item) => item.teacherId === teacher.id); const count = payroll?.attendanceCount ?? attendanceCount(teacher.id); return <tr key={teacher.id}><td>{index + 1}</td><td><strong>{teacher.fullName}</strong><small>{teacher.id}</small></td><td>{teacher.employmentType}</td><td>{count} sesi</td><td>{formatCurrency(payroll?.baseSalary ?? 0)}</td><td>{formatCurrency((payroll?.ratePerSession ?? 0) * count)}</td><td><strong>{formatCurrency(payroll?.total ?? 0)}</strong></td><td><span className={`operation-status ${payroll?.status ?? 'empty'}`}>{payroll?.status === 'paid' ? 'Dibayar' : payroll?.status === 'final' ? 'Final' : payroll ? 'Draft' : 'Belum dibuat'}</span></td><td className="row-actions"><button className="icon-action" title="Atur slip" onClick={() => openEditor(teacher)}><Pencil size={16} /></button>{payroll && <button className="icon-action" title="Cetak slip" onClick={() => { if (!printSlip(payroll, teacher)) notify({ tone: 'warning', title: 'Popup diblokir', message: 'Izinkan popup untuk mencetak slip.' }); }}><FileText size={16} /></button>}</td></tr>; })}</tbody></table></div></section>
    {editing && <div className="modal-overlay"><div className="modal-box payroll-modal"><button className="modal-close-icon" onClick={() => setEditing(null)} aria-label="Tutup"><X size={18} /></button><span className="eyebrow">SLIP {MONTHS[month - 1].toUpperCase()} {year}</span><h3>{editing.fullName}</h3><p>{attendanceCount(editing.id)} sesi hadir tercatat pada periode ini.</p><div className="modal-field-grid"><label>Gaji pokok<input type="number" min="0" value={form.baseSalary} onChange={(event) => setForm((value) => ({ ...value, baseSalary: Number(event.target.value) }))} /></label><label>Tarif per sesi<input type="number" min="0" value={form.ratePerSession} onChange={(event) => setForm((value) => ({ ...value, ratePerSession: Number(event.target.value) }))} /></label><label>Tunjangan<input type="number" min="0" value={form.allowance} onChange={(event) => setForm((value) => ({ ...value, allowance: Number(event.target.value) }))} /></label><label>Potongan<input type="number" min="0" value={form.deduction} onChange={(event) => setForm((value) => ({ ...value, deduction: Number(event.target.value) }))} /></label><label>Status<select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as TeacherPayroll['status'] }))}><option value="draft">Draft</option><option value="final">Final</option><option value="paid">Dibayar</option></select></label><label>Catatan<input value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label></div><div className="payroll-calculation"><span>Estimasi total</span><strong>{formatCurrency(Math.max(0, form.baseSalary + attendanceCount(editing.id) * form.ratePerSession + form.allowance - form.deduction))}</strong></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setEditing(null)}>Batal</button><button className="btn-primary" disabled={saving} onClick={() => void save()}>Simpan Slip</button></div></div></div>}
  </div>;
}
