import { useState } from 'react';
import type { DaySchedule, Page, Student } from '../types';
import { ALL_DAYS, PROGRAMS, STUDENTS as initialStudents, TEACHERS, formatCurrency, formatDate, getProgramById, getTimesForDay } from '../data/mockData';
import { useToast } from '../components/ui/ToastProvider';
import StudentTable from '../components/students/StudentTable';
import DataPagination from '../components/ui/DataPagination';
import { printStudentReport } from '../lib/pdfReports';

type StudentView = 'list' | 'form' | 'detail' | 'activation';

type Props = {
  onNavigate?: (page: Page, id?: string) => void;
  students?: Student[];
  onStudentsChange?: (students: Student[]) => void;
  viewStudentId?: string;
  editStudentId?: string;
  initialView?: StudentView;
};

function StudentList({ onNavigate, students }: { onNavigate: (page: Page, id?: string) => void; students: Student[] }) {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'off'>('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = students.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterProgram !== 'all' && s.programId !== filterProgram) return false;
    if (search && !`${s.fullName} ${s.parentName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const activeCount = students.filter((student) => student.status === 'active').length;
  const offCount = students.filter((student) => student.status === 'off').length;
  const activeProgramCount = new Set(
    students.filter((student) => student.status === 'active').map((student) => student.programId),
  ).size;
  const weeklySessions = students
    .filter((student) => student.status === 'active')
    .reduce((sum, student) => sum + student.schedules.length, 0);
  const hasActiveFilters = search.length > 0 || filterStatus !== 'all' || filterProgram !== 'all';
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleStudents = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="student-list-page">
      <div className="student-list-heading">
        <div>
          <span className="eyebrow">DATABASE MURID</span>
          <h2>Kelola murid dengan lebih mudah</h2>
          <p>Pantau program, guru, jadwal, dan status murid dalam satu tampilan.</p>
        </div>
        <div className="student-heading-actions"><button type="button" className="btn-secondary" onClick={() => { const opened = printStudentReport(filtered); notify(opened ? { tone: 'info', title: 'Laporan murid siap', message: 'Pilih Save as PDF pada dialog cetak.' } : { tone: 'warning', title: 'Popup diblokir', message: 'Izinkan popup browser lalu coba kembali.' }); }}>Cetak PDF</button><button className="btn-primary student-add-button" onClick={() => onNavigate('student-form')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Murid
        </button></div>
      </div>

      <div className="student-summary-grid">
        <div className="student-summary-item summary-total">
          <span className="student-summary-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>
          </span>
          <div><span>Total Murid</span><strong>{students.length}</strong><small>Data terdaftar</small></div>
        </div>
        <div className="student-summary-item summary-active">
          <span className="student-summary-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></svg>
          </span>
          <div><span>Murid Aktif</span><strong>{activeCount}</strong><small>{Math.round((activeCount / Math.max(students.length, 1)) * 100)}% dari total</small></div>
        </div>
        <div className="student-summary-item summary-off">
          <span className="student-summary-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
          </span>
          <div><span>Status Off</span><strong>{offCount}</strong><small>Riwayat tersimpan</small></div>
        </div>
        <div className="student-summary-item summary-program">
          <span className="student-summary-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
          </span>
          <div><span>Program Aktif</span><strong>{activeProgramCount}</strong><small>{weeklySessions} sesi per minggu</small></div>
        </div>
      </div>

      <div className="student-toolbar">
        <div className="student-search-field">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input placeholder="Cari nama murid atau orang tua..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="student-filter-divider" />
        <select className="student-filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as 'all' | 'active' | 'off'); setPage(1); }}>
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="off">Off</option>
        </select>
        <select className="student-filter-select program-filter" value={filterProgram} onChange={(e) => { setFilterProgram(e.target.value); setPage(1); }}>
          <option value="all">Semua Program</option>
          {PROGRAMS.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            className="student-reset-filter"
            onClick={() => {
              setSearch('');
              setFilterStatus('all');
              setFilterProgram('all');
              setPage(1);
            }}
          >
            Reset
          </button>
        )}
        <span className="student-result-count">{filtered.length} data - halaman {safePage} dari {totalPages}</span>
      </div>
      <StudentTable students={visibleStudents} onNavigate={onNavigate} startIndex={pageStart} />
      <DataPagination totalItems={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="murid" />
    </div>
  );
}

function StudentForm({ student, onSave, onCancel }: { student?: Student; onSave: (data: Partial<Student>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ fullName: student?.fullName ?? '', parentName: student?.parentName ?? '', address: student?.address ?? '', phone: student?.phone ?? '', programId: student?.programId ?? PROGRAMS[0].id, sessionsPerWeek: student?.sessionsPerWeek ?? 3, joinDate: student?.joinDate ?? '', leaveDate: student?.leaveDate ?? '', teacherId: student?.teacherId ?? TEACHERS.find((t) => t.status === 'active')?.id ?? '', schedules: student?.schedules ?? [{ day: 'Senin', time: '15.00' }], notes: student?.notes ?? '' });
  const addSchedule = () => setForm((f) => ({ ...f, schedules: [...f.schedules, { day: 'Senin', time: '15.00' }] }));
  const updateSchedule = (i: number, field: keyof DaySchedule, val: string) => setForm((f) => { const schedules = [...f.schedules]; schedules[i] = { ...schedules[i], [field]: val }; if (field === 'day') schedules[i].time = getTimesForDay(val)[0]; return { ...f, schedules }; });
  const selectedProgram = PROGRAMS.find((p) => p.id === form.programId);
  return (
    <div>
      <div className="page-header"><button className="btn-secondary" onClick={onCancel}>Kembali</button><button className="btn-primary" onClick={() => onSave(form)}>Simpan</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card"><div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Data Pribadi</div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div><label className="input-label">Nama Lengkap *</label><input className="input-field" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div><div><label className="input-label">Nama Orang Tua *</label><input className="input-field" value={form.parentName} onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))} /></div><div><label className="input-label">Alamat Lengkap *</label><textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div><div><label className="input-label">No. Telepon *</label><input className="input-field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div></div></div>
        <div className="card"><div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Program & Guru</div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div><label className="input-label">Program *</label><select className="input-field" value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value }))}>{PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}/bln</option>)}</select></div>{selectedProgram && <div style={{ background: '#EEF7F8', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2F7884', fontWeight: 600 }}>Biaya Les: {formatCurrency(selectedProgram.price)}/bln | Biaya Daftar: Rp100.000 | Buku: Rp100.000/2bln</div>}<div><label className="input-label">Guru *</label><select className="input-field" value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}>{TEACHERS.filter((t) => t.status === 'active').map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div><label className="input-label">Tanggal Masuk *</label><input className="input-field" type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} /></div><div><label className="input-label">Tanggal Off</label><input className="input-field" type="date" value={form.leaveDate} onChange={(e) => setForm((f) => ({ ...f, leaveDate: e.target.value }))} /></div></div></div></div>
        <div className="card"><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><div className="section-title" style={{ fontSize: 15 }}>Jadwal Belajar</div><button className="btn-secondary btn-sm" onClick={addSchedule}>+ Tambah Jadwal</button></div><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{form.schedules.map((sched, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><select className="input-field" value={sched.day} onChange={(e) => updateSchedule(i, 'day', e.target.value)}>{ALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select><select className="input-field" value={sched.time} onChange={(e) => updateSchedule(i, 'time', e.target.value)}>{getTimesForDay(sched.day).map((t) => <option key={t} value={t}>{t} WIB</option>)}</select>{form.schedules.length > 1 && <button className="btn-danger btn-sm" onClick={() => setForm((f) => ({ ...f, schedules: f.schedules.filter((_, idx) => idx !== i) }))}>Hapus</button>}</div>)}</div></div>
        <div className="card"><div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Keterangan Tambahan</div><textarea className="input-field" rows={5} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
      </div>
    </div>
  );
}

function StudentDetail({ student, onEdit, onBack }: { student: Student; onEdit: () => void; onBack: () => void }) {
  const program = getProgramById(student.programId);
  const teacher = TEACHERS.find((t) => t.id === student.teacherId);
  return <div><div className="page-header"><button className="btn-secondary" onClick={onBack}>Kembali</button><button className="btn-primary" onClick={onEdit}>Edit Murid</button></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}><div className="card"><div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}><div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EEF7F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#2F7884' }}>{student.fullName.charAt(0)}</div><div><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: '#1F2933' }}>{student.fullName}</div><span className={`badge badge-${student.status}`}>{student.status === 'active' ? 'Aktif' : 'Off'}</span></div></div>{[['Nama Orang Tua', student.parentName], ['Alamat', student.address], ['No. Telepon', student.phone], ['Tanggal Masuk', formatDate(student.joinDate)], ['Tanggal Off', student.leaveDate ? formatDate(student.leaveDate) : '-']].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F5F6' }}><span style={{ fontSize: 13, color: '#6B7C8D', fontWeight: 600 }}>{label}</span><span style={{ fontSize: 13, color: '#1F2933', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value}</span></div>)}</div><div className="card"><div className="section-title" style={{ fontSize: 15, marginBottom: 12 }}>Program</div><div style={{ background: '#EEF7F8', borderRadius: 10, padding: '14px 16px' }}><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 700, color: '#2F7884' }}>{program?.name ?? '-'}</div><div style={{ fontSize: 13, color: '#2F7884', marginTop: 2 }}>{formatCurrency(program?.price ?? 0)} / bulan</div><div style={{ fontSize: 12, color: '#6B7C8D', marginTop: 6 }}>{student.sessionsPerWeek}x/minggu | Guru: {teacher?.fullName ?? '-'}</div></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{student.schedules.map((s, i) => <div key={i} style={{ background: '#EEF7F8', border: '1.5px solid #C8E4E8', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#2F7884' }}>{s.day}</div><div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#4A6070' }}>{s.time} WIB</div></div>)}</div></div></div></div>;
}

function StudentActivation({ students, setStudents }: { students: Student[]; setStudents: (s: Student[]) => void }) {
  const { notify } = useToast();
  const [modal, setModal] = useState<{ student: Student; action: 'off' | 'activate' } | null>(null);
  const [reason, setReason] = useState('');
  const [offDate, setOffDate] = useState('2026-07-31');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'off'>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusPage, setStatusPage] = useState(1);
  const [statusPageSize, setStatusPageSize] = useState(10);
  const activeCount = students.filter((student) => student.status === 'active').length;
  const offCount = students.length - activeCount;
  const recentChanges = students.reduce((count, student) => count + student.statusHistory.filter((history) => history.date.startsWith('2026-07')).length, 0);
  const filtered = students.filter((student) => {
    if (statusFilter !== 'all' && student.status !== statusFilter) return false;
    if (programFilter !== 'all' && student.programId !== programFilter) return false;
    return !search || `${student.fullName} ${student.parentName}`.toLowerCase().includes(search.toLowerCase());
  });
  const statusTotalPages = Math.max(1, Math.ceil(filtered.length / statusPageSize));
  const safeStatusPage = Math.min(statusPage, statusTotalPages);
  const statusPageStart = (safeStatusPage - 1) * statusPageSize;
  const visibleStatusStudents = filtered.slice(statusPageStart, statusPageStart + statusPageSize);
  const openAction = (student: Student, action: 'off' | 'activate') => { setReason(''); setOffDate('2026-07-31'); setModal({ student, action }); };
  const doAction = () => {
    if (!modal) return;
    if (modal.action === 'off' && !reason.trim()) {
      notify({ tone: 'error', title: 'Alasan belum diisi', message: 'Tuliskan alasan agar riwayat status murid tetap lengkap.' });
      return;
    }
    setStudents(students.map((student) => student.id !== modal.student.id ? student : { ...student, status: modal.action === 'off' ? 'off' : 'active', leaveDate: modal.action === 'off' ? offDate : undefined, statusHistory: [...student.statusHistory, { date: modal.action === 'off' ? offDate : '2026-07-31', action: modal.action === 'off' ? 'deactivated' : 'activated', reason: modal.action === 'off' ? reason.trim() : undefined, by: 'Admin' }] }));
    notify({ tone: modal.action === 'off' ? 'warning' : 'success', title: modal.action === 'off' ? 'Murid dinonaktifkan' : 'Murid diaktifkan kembali', message: `${modal.student.fullName} berhasil diperbarui.` });
    setModal(null);
  };

  return (
    <div className="student-status-page">
      <div className="status-page-heading"><div><span className="eyebrow">STATUS & RIWAYAT</span><h2>Kelola aktivitas murid</h2><p>Pantau murid aktif, riwayat berhenti, dan aktifkan kembali dengan mudah.</p></div><span className="status-live-indicator"><i />Data frontend tersinkron</span></div>
      <div className="status-summary-grid">
        <article className="status-summary-card summary-all"><span className="status-summary-icon">◎</span><div><small>Total Murid</small><strong>{students.length}</strong><p>Seluruh data terdaftar</p></div></article>
        <article className="status-summary-card summary-active"><span className="status-summary-icon">✓</span><div><small>Murid Aktif</small><strong>{activeCount}</strong><p>{students.length ? Math.round((activeCount / students.length) * 100) : 0}% dari total murid</p></div></article>
        <article className="status-summary-card summary-off"><span className="status-summary-icon">−</span><div><small>Status Off</small><strong>{offCount}</strong><p>Riwayat tersimpan</p></div></article>
        <article className="status-summary-card summary-history"><span className="status-summary-icon">↻</span><div><small>Perubahan Bulan Ini</small><strong>{recentChanges}</strong><p>Aktivasi dan nonaktif</p></div></article>
      </div>
      <div className="status-filterbar">
        <div className="status-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari murid atau orang tua..." /></div>
        <select className="input-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'off')}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="off">Off</option></select>
        <select className="input-field" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><option value="all">Semua Program</option>{PROGRAMS.map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select>
        <span>{filtered.length} murid ditemukan</span>
      </div>
      <div className="status-table-shell">
        <table className="status-student-table">
          <thead><tr><th>Murid</th><th>Program & Guru</th><th>Tanggal Masuk</th><th>Tanggal Off</th><th>Status Terakhir</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="status-empty">Tidak ada murid yang sesuai dengan filter.</td></tr>}
            {visibleStatusStudents.map((student, rowIndex) => {
              const program = getProgramById(student.programId);
              const teacher = TEACHERS.find((item) => item.id === student.teacherId);
              const lastHistory = student.statusHistory[student.statusHistory.length - 1];
              return <tr key={student.id}><td><div className="status-student-name"><span className="table-row-number">{statusPageStart + rowIndex + 1}</span><span>{student.fullName.charAt(0)}</span><div><strong>{student.fullName}</strong><small>{student.parentName}</small></div></div></td><td><strong>{program?.name ?? '-'}</strong><small>{teacher?.fullName ?? '-'}</small></td><td><strong>{formatDate(student.joinDate)}</strong><small>{student.schedules.length} sesi / minggu</small></td><td><strong>{student.leaveDate ? formatDate(student.leaveDate) : '-'}</strong><small>{student.leaveDate ? 'Tanggal berhenti' : 'Masih bergabung'}</small></td><td><div className={`history-line history-${lastHistory.action}`}><i /><span><strong>{lastHistory.action === 'activated' ? 'Diaktifkan' : 'Dinonaktifkan'}</strong><small>{lastHistory.reason ?? `oleh ${lastHistory.by}`}</small></span></div></td><td><span className={`status-pill status-pill-${student.status}`}><i />{student.status === 'active' ? 'Aktif' : 'Off'}</span></td><td>{student.status === 'active' ? <button type="button" className="status-action status-action-off" onClick={() => openAction(student, 'off')}>Nonaktifkan</button> : <button type="button" className="status-action status-action-on" onClick={() => openAction(student, 'activate')}>Aktifkan</button>}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <DataPagination totalItems={filtered.length} page={safeStatusPage} pageSize={statusPageSize} onPageChange={setStatusPage} onPageSizeChange={(size) => { setStatusPageSize(size); setStatusPage(1); }} label="murid" />
      {modal && <div className="modal-overlay"><div className={`modal-box status-action-modal modal-${modal.action}`}><div className="status-modal-head"><span>{modal.action === 'off' ? '−' : '✓'}</span><div><small>{modal.action === 'off' ? 'NONAKTIFKAN MURID' : 'AKTIFKAN KEMBALI'}</small><h2>{modal.student.fullName}</h2><p>{modal.action === 'off' ? 'Jadwal aktif akan dilepas, tetapi seluruh riwayat murid tetap tersimpan.' : 'Murid akan kembali masuk ke daftar aktif dan dapat dijadwalkan kembali.'}</p></div></div>{modal.action === 'off' ? <div className="status-modal-form"><div><label className="input-label">Tanggal Off *</label><input className="input-field" type="date" value={offDate} onChange={(event) => setOffDate(event.target.value)} /></div><div><label className="input-label">Alasan Berhenti *</label><textarea className="input-field" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: pindah domisili atau selesai program" /></div></div> : <div className="reactivate-preview"><span>✓</span><div><strong>Data siap diaktifkan</strong><small>Riwayat sebelumnya tidak akan dihapus.</small></div></div>}<div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setModal(null)}>Batal</button><button type="button" className={modal.action === 'off' ? 'btn-danger' : 'btn-primary'} onClick={doAction}>{modal.action === 'off' ? 'Konfirmasi Nonaktif' : 'Aktifkan Murid'}</button></div></div></div>}
    </div>
  );
}

export default function Students({
  students: controlledStudents,
  onStudentsChange: controlledStudentsChange,
  viewStudentId,
  editStudentId,
  initialView,
}: Props = {}) {
  const { notify } = useToast();
  const [fallbackStudents, setFallbackStudents] = useState<Student[]>(initialStudents);
  const students = controlledStudents ?? fallbackStudents;
  const onStudentsChange = controlledStudentsChange ?? setFallbackStudents;
  const [subPage, setSubPage] = useState<StudentView>(
    initialView ?? (viewStudentId ? 'detail' : editStudentId ? 'form' : 'list'),
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(viewStudentId ?? editStudentId);
  const selectedStudent = students.find((s) => s.id === selectedId);
  const handleNavigate = (page: Page, id?: string) => { if (page === 'student-form') { setSubPage('form'); setSelectedId(id); } else if (page === 'student-detail') { setSubPage('detail'); setSelectedId(id); } else if (page === 'student-activation') setSubPage('activation'); };
  const handleSave = (data: Partial<Student>) => { const isEditing = Boolean(selectedId); if (selectedId) onStudentsChange(students.map((s) => s.id === selectedId ? { ...s, ...data } : s)); else onStudentsChange([...students, { id: `S${String(students.length + 1).padStart(3, '0')}`, status: 'active', statusHistory: [{ date: '2026-07-31', action: 'activated', by: 'Admin' }], ...(data as Omit<Student, 'id' | 'status' | 'statusHistory'>) }]); notify({ tone: 'success', title: isEditing ? 'Data murid diperbarui' : 'Murid baru ditambahkan', message: `${data.fullName ?? 'Data murid'} berhasil disimpan.` }); setSubPage('list'); setSelectedId(undefined); };
  if (subPage === 'activation') return <StudentActivation students={students} setStudents={onStudentsChange} />;
  if (subPage === 'form') return <StudentForm student={selectedStudent} onSave={handleSave} onCancel={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  if (subPage === 'detail' && selectedStudent) return <StudentDetail student={selectedStudent} onEdit={() => setSubPage('form')} onBack={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  return <StudentList onNavigate={handleNavigate} students={students} />;
}
