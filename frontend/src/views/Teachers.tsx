import { useState } from 'react';
import type { ClassSession, EmploymentType, Page, Student, Teacher } from '../types';
import { EDUCATION_LEVELS, RELIGIONS, TEACHERS as initialTeachers, formatDate } from '../data/mockData';
import { useToast } from '../components/ui/ToastProvider';
import TeacherTable from '../components/teachers/TeacherTable';
import TeacherInsights from '../components/teachers/TeacherInsights';
import DataPagination from '../components/ui/DataPagination';
import { printTeacherReport } from '../lib/pdfReports';

type TeacherView = 'list' | 'form' | 'detail' | 'activation';

type Props = {
  canManage?: boolean;
  onNavigate: (page: Page, id?: string) => void;
  initialView?: TeacherView;
  initialTeacherId?: string;
  students: Student[];
  sessions: ClassSession[];
  teachers?: Teacher[];
  onTeachersChange?: (teachers: Teacher[]) => void;
};
const EMPLOYMENT_LABELS: Record<EmploymentType, string> = { fulltime: 'Fulltime', parttime: 'Part Time', magang: 'Magang' };

function TeacherStatusOverview({ teachers, sessions }: { teachers: Teacher[]; sessions: ClassSession[] }) {
  const activeCount = teachers.filter((teacher) => teacher.status === 'active').length;
  const offCount = teachers.length - activeCount;
  const activePercent = teachers.length ? Math.round((activeCount / teachers.length) * 100) : 0;
  const assignedTeachers = new Set(sessions.map((session) => session.teacherId)).size;
  const employment = (['fulltime', 'parttime', 'magang'] as EmploymentType[]).map((type) => ({
    type,
    label: EMPLOYMENT_LABELS[type],
    count: teachers.filter((teacher) => teacher.status === 'active' && teacher.employmentType === type).length,
  }));
  const recentActivity = teachers
    .flatMap((teacher) => teacher.statusHistory.map((history) => ({ teacher, history })))
    .sort((a, b) => b.history.date.localeCompare(a.history.date))
    .slice(0, 4);

  return (
    <>
      <div className="status-page-heading teacher-status-heading">
        <div>
          <span className="eyebrow">STATUS TENAGA PENGAJAR</span>
          <h2>Kontrol aktivitas guru</h2>
          <p>Pantau kesiapan tim, komposisi kerja, dan riwayat perubahan status guru.</p>
        </div>
        <span className="status-live-indicator"><i />Data guru terpantau</span>
      </div>

      <div className="status-summary-grid teacher-status-summary">
        <article className="status-summary-card summary-all"><span className="status-summary-icon">T</span><div><small>Total Guru</small><strong>{teachers.length}</strong><p>Seluruh tenaga pengajar</p></div></article>
        <article className="status-summary-card summary-active"><span className="status-summary-icon">A</span><div><small>Guru Aktif</small><strong>{activeCount}</strong><p>{activePercent}% siap mengajar</p></div></article>
        <article className="status-summary-card summary-off"><span className="status-summary-icon">O</span><div><small>Status Off</small><strong>{offCount}</strong><p>Riwayat tetap tersimpan</p></div></article>
        <article className="status-summary-card summary-history"><span className="status-summary-icon">K</span><div><small>Guru Terjadwal</small><strong>{assignedTeachers}</strong><p>{sessions.length} kelas per minggu</p></div></article>
      </div>

      <div className="teacher-status-insight-grid">
        <article className="teacher-status-insight-card">
          <header><div><span className="eyebrow">KESIAPAN TIM</span><h3>Komposisi guru aktif</h3></div><strong>{activePercent}%</strong></header>
          <div className="teacher-status-progress" aria-label={`${activePercent}% guru aktif`}><span style={{ width: `${activePercent}%` }} /></div>
          <div className="teacher-status-employment">
            {employment.map((item) => <div key={item.type}><i className={`employment-${item.type}`} /><span>{item.label}</span><strong>{item.count}</strong></div>)}
          </div>
          <footer><span>{activeCount} aktif</span><span>{offCount} off</span><span>{assignedTeachers} terjadwal</span></footer>
        </article>

        <article className="teacher-status-insight-card teacher-status-activity">
          <header><div><span className="eyebrow">AKTIVITAS TERBARU</span><h3>Riwayat perubahan status</h3></div><small>{recentActivity.length} aktivitas</small></header>
          <div className="teacher-status-activity-list">
            {recentActivity.map(({ teacher, history }, index) => (
              <div key={`${teacher.id}-${history.date}-${index}`}>
                <span className={history.action === 'activated' ? 'activity-on' : 'activity-off'}>{teacher.fullName.charAt(0)}</span>
                <div><strong>{teacher.fullName}</strong><small>{history.action === 'activated' ? 'Diaktifkan' : 'Dinonaktifkan'}{history.reason ? ` - ${history.reason}` : ` oleh ${history.by}`}</small></div>
                <time>{formatDate(history.date)}</time>
              </div>
            ))}
            {recentActivity.length === 0 && <div className="teacher-status-empty">Belum ada aktivitas status.</div>}
          </div>
        </article>
      </div>

      <div className="teacher-status-directory-heading">
        <div><span className="eyebrow">DAFTAR STATUS</span><h3>Kelola status setiap guru</h3></div>
        <span>{teachers.length} guru terdaftar</span>
      </div>
    </>
  );
}

function TeacherList({ teachers, students, sessions, onView, onEdit, onActivation, canManage }: { teachers: Teacher[]; students: Student[]; sessions: ClassSession[]; onView: (id: string) => void; onEdit: (id: string) => void; onActivation: () => void; canManage: boolean }) {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'off'>('all');
  const [filterType, setFilterType] = useState<'all' | EmploymentType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = teachers.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.employmentType !== filterType) return false;
    if (search && !t.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleTeachers = filtered.slice(pageStart, pageStart + pageSize);
  return (
    <div className="teacher-page">
      <div className="teacher-page-heading"><div><span className="eyebrow">TENAGA PENGAJAR</span><h2>Tim pengajar EdGLO</h2><p>Pantau komposisi tim, beban mengajar, dan data kepegawaian dalam satu tampilan.</p></div><div className="teacher-page-actions"><button type="button" className="btn-secondary" onClick={() => { const opened = printTeacherReport(filtered); notify(opened ? { tone: 'info', title: 'Laporan guru siap', message: 'Pilih Save as PDF pada dialog cetak.' } : { tone: 'warning', title: 'Popup diblokir', message: 'Izinkan popup browser lalu coba kembali.' }); }}>Cetak PDF</button><button className="btn-secondary" onClick={onActivation}>{canManage ? 'Kelola Status' : 'Lihat Status'}</button>{canManage && <button className="btn-primary" onClick={() => onEdit('')}>+ Tambah Guru</button>}</div></div>
      <TeacherInsights teachers={teachers} students={students} sessions={sessions} />
      <div className="teacher-list-heading"><div><span className="eyebrow">DIREKTORI GURU</span><h3>Data tenaga pengajar</h3></div><span>{filtered.length} data ditemukan</span></div>
      <div className="teacher-filterbar"><label className="teacher-search"><span aria-hidden="true">⌕</span><input placeholder="Cari nama guru..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label><select className="input-field" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as 'all' | 'active' | 'off'); setPage(1); }}><option value="all">Semua Status</option><option value="active">Aktif</option><option value="off">Off</option></select><select className="input-field" value={filterType} onChange={(e) => { setFilterType(e.target.value as 'all' | EmploymentType); setPage(1); }}><option value="all">Semua Tipe Kerja</option><option value="fulltime">Fulltime</option><option value="parttime">Part Time</option><option value="magang">Magang</option></select></div>
      <TeacherTable teachers={visibleTeachers} sessions={sessions} onView={onView} onEdit={onEdit} startIndex={pageStart} canManage={canManage} />
      <DataPagination totalItems={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="guru" />
    </div>
  );
}

function TeacherForm({ teacher, onSave, onCancel }: { teacher?: Teacher; onSave: (data: Partial<Teacher>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ fullName: teacher?.fullName ?? '', address: teacher?.address ?? '', birthPlace: teacher?.birthPlace ?? '', birthDate: teacher?.birthDate ?? '', religion: teacher?.religion ?? 'Islam', email: teacher?.email ?? '', phone: teacher?.phone ?? '', emergencyContactName: teacher?.emergencyContactName ?? '', emergencyContactPhone: teacher?.emergencyContactPhone ?? '', lastEducation: teacher?.lastEducation ?? 'S1', joinDate: teacher?.joinDate ?? '', employmentType: teacher?.employmentType ?? ('fulltime' as EmploymentType), notes: teacher?.notes ?? '', photoFile: undefined as File | undefined });
  const set = (key: keyof typeof form, value: string | File | undefined) => setForm((current) => ({ ...current, [key]: value } as typeof current));
  return (
    <div>
      <div className="page-header"><button className="btn-secondary" onClick={onCancel}>Kembali</button><button className="btn-primary" onClick={() => onSave(form)}>Simpan</button></div>
      <div className="entity-form-grid">
        <div className="card entity-form-card"><div className="section-title">Data Pribadi</div><div className="form-stack"><label className="photo-upload-field"><span className="photo-upload-preview">{teacher?.photo ? <span style={{ backgroundImage: `url(${teacher.photo})` }} /> : form.fullName.charAt(0) || 'G'}</span><span><strong>Foto guru</strong><small>{form.photoFile?.name ?? 'JPG atau PNG, maksimal 2 MB'}</small></span><input type="file" accept="image/png,image/jpeg" onChange={(event) => set('photoFile', event.target.files?.[0])} /></label><label>Nama Lengkap *<input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></label><label>Alamat *<textarea rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} /></label><div className="form-two-columns"><label>Tempat Lahir<input value={form.birthPlace} onChange={(e) => set('birthPlace', e.target.value)} /></label><label>Tanggal Lahir<input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></label></div><label>Agama<select value={form.religion} onChange={(e) => set('religion', e.target.value)}>{RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></label></div></div>
        <div className="card entity-form-card"><div className="section-title">Kontak & Kepegawaian</div><div className="form-stack"><label>Email<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></label><label>No. Telepon *<input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label><div className="form-two-columns"><label>Nama kontak darurat<input value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} /></label><label>Telepon darurat<input value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} /></label></div><label>Pendidikan Terakhir<select value={form.lastEducation} onChange={(e) => set('lastEducation', e.target.value)}>{EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label><label>Status Kerja<select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}><option value="fulltime">Fulltime</option><option value="parttime">Part Time</option><option value="magang">Magang</option></select></label><label>Tanggal Masuk *<input type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} /></label><label>Keterangan<textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label><div className="status-managed-note">Tanggal Off dikelola dari Status Guru agar riwayat tidak terputus.</div></div></div>
      </div>
    </div>
  );
}

function TeacherDetail({ teacher, onEdit, onBack, canManage }: { teacher: Teacher; onEdit: () => void; onBack: () => void; canManage: boolean }) {
  const details = [
    ['Tempat, Tgl Lahir', `${teacher.birthPlace}, ${formatDate(teacher.birthDate)}`],
    ['Agama', teacher.religion],
    ['Alamat', teacher.address],
    ['Email', teacher.email],
    ['No. Telepon', teacher.phone],
    ['Kontak Darurat', teacher.emergencyContactName ? `${teacher.emergencyContactName} - ${teacher.emergencyContactPhone || '-'}` : '-'],
    ['Pendidikan Terakhir', teacher.lastEducation],
    ['Tanggal Masuk', formatDate(teacher.joinDate)],
    ['Tanggal Off', teacher.leaveDate ? formatDate(teacher.leaveDate) : '-'],
  ];

  return (
    <div className="entity-detail-page teacher-detail-page">
      <div className="page-header detail-page-actions">
        <button className="btn-secondary" onClick={onBack}>Kembali</button>
        {canManage && <button className="btn-primary" onClick={onEdit}>Edit Guru</button>}
      </div>
      <div className="entity-detail-grid">
        <section className="card entity-profile-card">
          <div className="entity-profile-head">
            <div className="entity-avatar teacher-entity-avatar" style={teacher.photo ? { backgroundImage: `url(${teacher.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>{teacher.fullName.charAt(0)}</div>
            <div className="entity-profile-copy">
              <h2>{teacher.fullName}</h2>
              <p>ID: {teacher.id}</p>
              <div className="entity-badges">
                <span className={'badge badge-' + teacher.status}>{teacher.status === 'active' ? 'Aktif' : 'Off'}</span>
                <span className={'badge badge-' + teacher.employmentType}>{EMPLOYMENT_LABELS[teacher.employmentType]}</span>
              </div>
            </div>
          </div>
          <div className="entity-info-list">
            {details.map(([label, value]) => (
              <div className="entity-info-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="card entity-side-card">
          <div className="section-title entity-section-title">Riwayat Status</div>
          <div className="entity-history-list">
            {teacher.statusHistory.map((history, index) => (
              <div className="entity-history-item" key={index}>
                <span className={'entity-history-dot ' + (history.action === 'activated' ? 'is-active' : 'is-off')} />
                <div>
                  <strong className={history.action === 'activated' ? 'is-active' : 'is-off'}>
                    {history.action === 'activated' ? 'Diaktifkan' : 'Dinonaktifkan'}
                  </strong>
                  {history.reason && <p>{history.reason}</p>}
                </div>
                <time>{formatDate(history.date)}</time>
              </div>
            ))}
          </div>
          {teacher.notes && <div className="entity-note-box"><span>Keterangan</span><p>{teacher.notes}</p></div>}
        </section>
      </div>
    </div>
  );
}

function TeacherActivation({ teachers, setTeachers, canManage }: { teachers: Teacher[]; setTeachers: (t: Teacher[]) => void; canManage: boolean }) {
  const { notify } = useToast();
  const [modal, setModal] = useState<{ teacher: Teacher; action: 'off' | 'activate' } | null>(null);
  const [reason, setReason] = useState('');
  const [offDate, setOffDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusPage, setStatusPage] = useState(1);
  const [statusPageSize, setStatusPageSize] = useState(10);
  const statusTotalPages = Math.max(1, Math.ceil(teachers.length / statusPageSize));
  const safeStatusPage = Math.min(statusPage, statusTotalPages);
  const statusPageStart = (safeStatusPage - 1) * statusPageSize;
  const visibleStatusTeachers = teachers.slice(statusPageStart, statusPageStart + statusPageSize);
  const doAction = () => { if (!modal) return; setTeachers(teachers.map((t) => t.id !== modal.teacher.id ? t : { ...t, status: modal.action === 'off' ? 'off' : 'active', leaveDate: modal.action === 'off' ? offDate : undefined, statusHistory: [...t.statusHistory, { date: offDate, action: modal.action === 'off' ? 'deactivated' : 'activated', reason: reason || undefined, by: 'Super Admin (Owner)' }] })); notify({ tone: modal.action === 'off' ? 'warning' : 'success', title: modal.action === 'off' ? 'Guru dinonaktifkan' : 'Guru diaktifkan', message: `${modal.teacher.fullName} berhasil diperbarui.` }); setModal(null); setReason(''); };
  return <div className="teacher-status-page"><div className="card teacher-status-table-shell" style={{ padding: 0, overflow: 'hidden' }}><table className="teacher-status-table" style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}><thead><tr style={{ background: '#F5FAFB', borderBottom: '1.5px solid #E2EEF0' }}>{['Nama Guru', 'Tipe Kerja', 'Tgl Masuk', 'Tgl Off', 'Status', 'Aksi'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11, fontWeight: 800, color: '#6B7C8D', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead><tbody>{visibleStatusTeachers.map((teacher, rowIndex) => <tr key={teacher.id} className="table-row" style={{ borderBottom: '1px solid #F0F5F6' }}><td style={{ padding: '10px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="table-row-number">{statusPageStart + rowIndex + 1}</span><strong style={{ fontSize: 13, color: '#1F2933' }}>{teacher.fullName}</strong></div></td><td style={{ padding: '10px 14px' }}><span className={`badge badge-${teacher.employmentType}`}>{EMPLOYMENT_LABELS[teacher.employmentType]}</span></td><td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7C8D' }}>{formatDate(teacher.joinDate)}</td><td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7C8D' }}>{teacher.leaveDate ? formatDate(teacher.leaveDate) : '-'}</td><td style={{ padding: '10px 14px' }}><span className={`badge badge-${teacher.status}`}>{teacher.status === 'active' ? 'Aktif' : 'Off'}</span></td><td style={{ padding: '10px 14px' }}>{canManage ? (teacher.status === 'active' ? <button className="btn-danger btn-sm" onClick={() => setModal({ teacher, action: 'off' })}>Nonaktifkan</button> : <button className="btn-primary btn-sm" onClick={() => setModal({ teacher, action: 'activate' })}>Aktifkan Kembali</button>) : <span className="read-only-label">Lihat saja</span>}</td></tr>)}</tbody></table></div><DataPagination totalItems={teachers.length} page={safeStatusPage} pageSize={statusPageSize} onPageChange={setStatusPage} onPageSizeChange={(size) => { setStatusPageSize(size); setStatusPage(1); }} label="guru" />{modal && <div className="modal-overlay"><div className="modal-box"><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{modal.action === 'off' ? 'Nonaktifkan Guru' : 'Aktifkan Kembali'}</div><div style={{ fontSize: 14, color: '#6B7C8D', marginBottom: 20 }}>{modal.teacher.fullName}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div><label className="input-label">{modal.action === 'off' ? 'Tanggal Off' : 'Tanggal Aktif'}</label><input className="input-field" type="date" value={offDate} onChange={(e) => setOffDate(e.target.value)} /></div><div><label className="input-label">Alasan</label><textarea className="input-field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div></div><div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}><button className="btn-secondary" onClick={() => setModal(null)}>Batal</button><button className={modal.action === 'off' ? 'btn-danger' : 'btn-primary'} onClick={doAction}>{modal.action === 'off' ? 'Nonaktifkan' : 'Aktifkan'}</button></div></div></div>}</div>;
}

export default function Teachers({ initialView = 'list', initialTeacherId, students, sessions, teachers: controlledTeachers, onTeachersChange, canManage = true }: Props) {
  const { notify } = useToast();
  const [fallbackTeachers, setFallbackTeachers] = useState<Teacher[]>(initialTeachers);
  const teachers = controlledTeachers ?? fallbackTeachers;
  const setTeachers = onTeachersChange ?? setFallbackTeachers;
  const [subPage, setSubPage] = useState<TeacherView>(initialView);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialTeacherId);
  const selectedTeacher = teachers.find((t) => t.id === selectedId);
  const handleSave = (data: Partial<Teacher>) => { const isEditing = Boolean(selectedId); if (selectedId) setTeachers(teachers.map((t) => t.id === selectedId ? { ...t, ...data } : t)); else setTeachers([...teachers, { id: `T${String(teachers.length + 1).padStart(3, '0')}`, status: 'active', statusHistory: [{ date: '2026-07-31', action: 'activated', by: 'Admin' }], ...(data as Omit<Teacher, 'id' | 'status' | 'statusHistory'>) }]); notify({ tone: 'success', title: isEditing ? 'Data guru diperbarui' : 'Guru baru ditambahkan', message: `${data.fullName ?? 'Data guru'} berhasil disimpan.` }); setSubPage('list'); setSelectedId(undefined); };
  if (subPage === 'activation') return <div className="teacher-status-dashboard"><TeacherStatusOverview teachers={teachers} sessions={sessions} /><TeacherActivation teachers={teachers} setTeachers={setTeachers} canManage={canManage} /></div>;
  if (subPage === 'form' && canManage) return <TeacherForm teacher={selectedTeacher} onSave={handleSave} onCancel={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  if (subPage === 'detail' && selectedTeacher) return <TeacherDetail teacher={selectedTeacher} canManage={canManage} onEdit={() => setSubPage('form')} onBack={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  return <TeacherList teachers={teachers} students={students} sessions={sessions} canManage={canManage} onView={(id) => { setSelectedId(id); setSubPage('detail'); }} onEdit={(id) => { setSelectedId(id || undefined); setSubPage('form'); }} onActivation={() => setSubPage('activation')} />;
}

