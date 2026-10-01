import { useEffect, useState } from 'react';
import type { CourseRegistration, DaySchedule, Page, Program, Student, Teacher } from '../types';
import { ALL_DAYS, PROGRAMS, STUDENTS as initialStudents, TEACHERS, formatCurrency, formatDate, getTimesForDay } from '../data/mockData';
import { useToast } from '../components/ui/ToastProvider';
import StudentTable from '../components/students/StudentTable';
import DataPagination from '../components/ui/DataPagination';
import { printStudentReport } from '../lib/pdfReports';

type StudentView = 'list' | 'form' | 'detail' | 'activation';
type StudentSort = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc' | 'join-desc' | 'join-asc';

type Props = {
  canManage?: boolean;
  onNavigate?: (page: Page, id?: string) => void;
  students?: Student[];
  onStudentsChange?: (students: Student[]) => void;
  viewStudentId?: string;
  editStudentId?: string;
  initialView?: StudentView;
  teachers?: Teacher[];
  programs?: Program[];
  registrations?: CourseRegistration[];
};

function StudentList({ onNavigate, students, teachers, programs, canManage }: { onNavigate: (page: Page, id?: string) => void; students: Student[]; teachers: Teacher[]; programs: Program[]; canManage: boolean }) {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'off'>('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [sortBy, setSortBy] = useState<StudentSort>('id-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = students.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterProgram !== 'all' && s.programId !== filterProgram) return false;
    if (search && !`${s.fullName} ${s.parentName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((first, second) => {
    if (sortBy === 'id-asc' || sortBy === 'id-desc') {
      const comparison = first.id.localeCompare(second.id, 'id', { numeric: true, sensitivity: 'base' });
      return sortBy === 'id-asc' ? comparison : -comparison;
    }
    if (sortBy === 'name-asc' || sortBy === 'name-desc') {
      const comparison = first.fullName.localeCompare(second.fullName, 'id', { sensitivity: 'base' });
      return sortBy === 'name-asc' ? comparison : -comparison;
    }
    const comparison = new Date(first.joinDate).getTime() - new Date(second.joinDate).getTime();
    return sortBy === 'join-asc' ? comparison : -comparison;
  });
  const activeCount = students.filter((student) => student.status === 'active').length;
  const offCount = students.filter((student) => student.status === 'off').length;
  const activeProgramCount = new Set(
    students.filter((student) => student.status === 'active').map((student) => student.programId),
  ).size;
  const weeklySessions = students
    .filter((student) => student.status === 'active')
    .reduce((sum, student) => sum + student.schedules.length, 0);
  const hasActiveFilters = search.length > 0 || filterStatus !== 'all' || filterProgram !== 'all' || sortBy !== 'id-asc';
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
        <div className="student-heading-actions"><button type="button" className="btn-secondary" onClick={() => { const opened = printStudentReport(filtered, undefined, programs, teachers); notify(opened ? { tone: 'info', title: 'Laporan murid siap', message: 'Pilih Save as PDF pada dialog cetak.' } : { tone: 'warning', title: 'Popup diblokir', message: 'Izinkan popup browser lalu coba kembali.' }); }}>Cetak PDF</button>{canManage && <button className="btn-primary student-add-button" onClick={() => onNavigate('student-form')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Murid
        </button>}</div>
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
        <select aria-label="Filter status murid" className="student-filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as 'all' | 'active' | 'off'); setPage(1); }}>
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="off">Off</option>
        </select>
        <select aria-label="Filter program murid" className="student-filter-select program-filter" value={filterProgram} onChange={(e) => { setFilterProgram(e.target.value); setPage(1); }}>
          <option value="all">Semua Program</option>
          {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
        </select>
        <select aria-label="Urutkan data murid" className="student-filter-select sort-filter" value={sortBy} onChange={(e) => { setSortBy(e.target.value as StudentSort); setPage(1); }}>
          <option value="id-asc">ID terkecil</option>
          <option value="id-desc">ID terbaru</option>
          <option value="name-asc">Nama A-Z</option>
          <option value="name-desc">Nama Z-A</option>
          <option value="join-desc">Masuk terbaru</option>
          <option value="join-asc">Masuk terlama</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            className="student-reset-filter"
            onClick={() => {
              setSearch('');
              setFilterStatus('all');
              setFilterProgram('all');
              setSortBy('id-asc');
              setPage(1);
            }}
          >
            Reset
          </button>
        )}
        <span className="student-result-count">{filtered.length} data - halaman {safePage} dari {totalPages}</span>
      </div>
      <StudentTable students={visibleStudents} teachers={teachers} programs={programs} onNavigate={onNavigate} startIndex={pageStart} canManage={canManage} />
      <DataPagination totalItems={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="murid" />
    </div>
  );
}

function levelOptions(programName = '') {
  const name = programName.toLowerCase();
  if (name.includes('pra calistung')) return { levels: ['A', 'B', 'C'], duration: 6 };
  if (name.includes('calistung')) return { levels: ['A', 'B', 'C', 'D', 'E', 'Persiapan SD'], duration: 4 };
  if (name.includes('english')) return { levels: ['A', 'B', 'C', 'D', 'E'], duration: 4 };
  return { levels: [] as string[], duration: 0 };
}

function StudentForm({ student, registration, teachers, programs, onSave, onCancel }: { student?: Student; registration?: CourseRegistration; teachers: Teacher[]; programs: Program[]; onSave: (data: Partial<Student>) => void; onCancel: () => void }) {
  const initialProgram = programs.find((program) => program.id === (student?.programId ?? programs[0]?.id));
  const initialLevel = levelOptions(initialProgram?.name);
  const [form, setForm] = useState({
    fullName: student?.fullName ?? '',
    birthPlace: student?.birthPlace ?? '',
    birthDate: student?.birthDate ?? '',
    parentName: student?.parentName ?? '',
    address: student?.address ?? '',
    phone: student?.phone ?? '',
    photoFile: undefined as File | undefined,
    programId: student?.programId ?? programs[0]?.id ?? '',
    currentLevel: student?.currentLevel ?? initialLevel.levels[0] ?? '',
    levelStartedAt: student?.levelStartedAt ?? student?.joinDate ?? '',
    levelDurationMonths: student?.levelDurationMonths ?? (initialLevel.duration || undefined),
    sessionsPerWeek: student?.sessionsPerWeek ?? initialProgram?.sessionsPerWeek ?? 3,
    packageStartedAt: student?.packageStartedAt ?? student?.joinDate ?? '',
    packageEndsAt: student?.packageEndsAt ?? '',
    registrationFee: student?.registrationFee ?? 100000,
    bookFee: student?.bookFee ?? 100000,
    otherFee: student?.otherFee ?? 0,
    discount: student?.discount ?? 0,
    feeNotes: student?.feeNotes ?? '',
    joinDate: student?.joinDate ?? '',
    teacherId: student?.teacherId ?? teachers.find((teacher) => teacher.status === 'active')?.id ?? '',
    schedules: student?.schedules ?? [{ day: 'Senin', time: '15.00' }],
    notes: student?.notes ?? '',
  });
  const [photoPreview, setPhotoPreview] = useState(student?.photo ?? '');
  useEffect(() => () => {
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);
  const selectPhoto = (file?: File) => {
    setForm((current) => ({ ...current, photoFile: file }));
    setPhotoPreview(file ? URL.createObjectURL(file) : student?.photo ?? '');
  };
  const requestedSchedules = registration?.preferredSchedules?.length
    ? registration.preferredSchedules
    : (registration?.preferredDays ?? []).map((day) => ({ day, time: registration?.preferredTime }));
  const applicableRequestedSchedules = requestedSchedules
    .filter((schedule): schedule is { day: string; time: string } => Boolean(schedule.time))
    .map((schedule) => ({ day: schedule.day, time: schedule.time.replace(':', '.') }));
  const addSchedule = () => setForm((current) => {
    const program = programs.find((item) => item.id === current.programId);
    const scheduleLimit = program?.sessionsPerWeek ?? current.sessionsPerWeek;
    if (current.schedules.length >= scheduleLimit) return current;
    return { ...current, schedules: [...current.schedules, { day: 'Senin', time: '15.00' }] };
  });
  const updateSchedule = (i: number, field: keyof DaySchedule, val: string) => setForm((f) => { const schedules = [...f.schedules]; schedules[i] = { ...schedules[i], [field]: val }; if (field === 'day') schedules[i].time = getTimesForDay(val)[0]; return { ...f, schedules }; });
  const applyRequestedSchedules = () => {
    if (!applicableRequestedSchedules.length) return;
    setForm((current) => ({ ...current, schedules: applicableRequestedSchedules }));
  };
  const selectedProgram = programs.find((program) => program.id === form.programId);
  const requiredScheduleCount = selectedProgram?.sessionsPerWeek ?? form.sessionsPerWeek;
  const requestHasSchedule = applicableRequestedSchedules.length > 0;
  const requestCoversProgram = applicableRequestedSchedules.length >= requiredScheduleCount;
  const level = levelOptions(selectedProgram?.name);
  const levelDue = form.levelStartedAt && form.levelDurationMonths ? new Date(new Date(`${form.levelStartedAt}T00:00:00`).setMonth(new Date(`${form.levelStartedAt}T00:00:00`).getMonth() + form.levelDurationMonths)).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const changeProgram = (programId: string) => {
    const program = programs.find((item) => item.id === programId);
    const config = levelOptions(program?.name);
    setForm((current) => ({ ...current, programId, sessionsPerWeek: program?.sessionsPerWeek ?? current.sessionsPerWeek, currentLevel: config.levels[0] ?? '', levelDurationMonths: config.duration || undefined }));
  };
  return (
    <div>
      <div className="page-header"><button className="btn-secondary" onClick={onCancel}>Kembali</button><button className="btn-primary" onClick={() => onSave(form)}>Simpan</button></div>
      <div className="entity-form-grid">
        <div className="card entity-form-card"><div className="section-title">Data Pribadi</div><div className="form-stack"><label className="photo-upload-field"><span className="photo-upload-preview">{photoPreview ? <span style={{ backgroundImage: `url(${photoPreview})` }} /> : form.fullName.charAt(0) || 'M'}</span><span><strong>Foto murid</strong><small>{form.photoFile?.name ?? (student?.photo ? 'Foto tersimpan - pilih file untuk mengganti' : 'JPG atau PNG, maksimal 2 MB')}</small></span><input aria-label="Pilih foto murid" type="file" accept="image/png,image/jpeg" onChange={(event) => selectPhoto(event.target.files?.[0])} /></label><label>Nama Lengkap *<input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></label><div className="form-two-columns"><label>Tempat Lahir<input value={form.birthPlace} onChange={(e) => setForm((f) => ({ ...f, birthPlace: e.target.value }))} /></label><label>Tanggal Lahir<input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} /></label></div><label>Nama Orang Tua *<input value={form.parentName} onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))} /></label><label>No. Telepon *<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></label><label>Alamat Lengkap *<textarea rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></label></div></div>
        <div className="card entity-form-card">
          <div className="section-title">Program & Level</div>
          <div className="form-stack">
            <label>Program utama *<select value={form.programId} onChange={(e) => changeProgram(e.target.value)}>{programs.map((program) => <option key={program.id} value={program.id}>{program.name} - {formatCurrency(program.price)}/bln</option>)}</select></label>
            {level.levels.length > 0 && <><div className="form-two-columns"><label>Level saat ini<select value={form.currentLevel} onChange={(e) => setForm((f) => ({ ...f, currentLevel: e.target.value }))}>{level.levels.map((item) => <option key={item}>{item}</option>)}</select></label><label>Mulai level<input type="date" value={form.levelStartedAt} onChange={(e) => setForm((f) => ({ ...f, levelStartedAt: e.target.value }))} /></label></div><div className="level-due-note"><span>Durasi level</span><strong>{form.levelDurationMonths} bulan</strong><span>Evaluasi berikutnya</span><strong>{levelDue}</strong></div></>}
            <label>Guru *<select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}><option value="">Belum ditentukan</option>{teachers.filter((teacher) => teacher.status === 'active').map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}</select></label>
            <label>Tanggal Masuk *<input type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value, levelStartedAt: f.levelStartedAt || e.target.value, packageStartedAt: f.packageStartedAt || e.target.value }))} /></label>
            <div className="form-two-columns"><label>Mulai paket<input type="date" value={form.packageStartedAt} onChange={(e) => setForm((f) => ({ ...f, packageStartedAt: e.target.value }))} /></label><label>Berakhir paket<input type="date" min={form.packageStartedAt || undefined} value={form.packageEndsAt} onChange={(e) => setForm((f) => ({ ...f, packageEndsAt: e.target.value }))} /></label></div>
            <div className="status-managed-note">Perpanjangan dilakukan dengan memperbarui tanggal akhir paket. Jika masa paket lewat, sistem menonaktifkan murid secara otomatis. Admin tetap dapat menonaktifkan manual dari Status Murid.</div>
          </div>
        </div>
        <div className="card entity-form-card"><div className="section-title">Biaya Pendaftaran Awal</div><div className="form-stack"><div className="form-two-columns"><label>Biaya daftar<input type="number" min="0" value={form.registrationFee} onChange={(e) => setForm((f) => ({ ...f, registrationFee: Number(e.target.value) }))} /></label><label>Biaya buku<input type="number" min="0" value={form.bookFee} onChange={(e) => setForm((f) => ({ ...f, bookFee: Number(e.target.value) }))} /></label></div><div className="form-two-columns"><label>Biaya lainnya<input type="number" min="0" value={form.otherFee} onChange={(e) => setForm((f) => ({ ...f, otherFee: Number(e.target.value) }))} /></label><label>Potongan promo<input type="number" min="0" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) }))} /></label></div><label>Catatan biaya<input value={form.feeNotes} onChange={(e) => setForm((f) => ({ ...f, feeNotes: e.target.value }))} placeholder="Contoh: promo gratis pendaftaran" /></label><div className="fee-total-preview"><span>Total biaya awal di luar les</span><strong>{formatCurrency(Math.max(0, form.registrationFee + form.bookFee + form.otherFee - form.discount))}</strong></div></div></div>
        <div className="card student-schedule-form-card">
          <div className="student-schedule-form-head">
            <div>
              <div className="section-title">Jadwal Belajar</div>
              <p>Atur jadwal final setelah mencocokkan permintaan orang tua dan waktu guru.</p>
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={addSchedule} disabled={form.schedules.length >= requiredScheduleCount}>+ Tambah Jadwal</button>
          </div>

          {registration && (
            <section className="parent-schedule-request" aria-label="Permintaan jadwal orang tua">
              <div className="parent-schedule-request-head">
                <div>
                  <span>REFERENSI PENDAFTARAN</span>
                  <h3>Permintaan Orang Tua</h3>
                  <p>Dikirim oleh {registration.parent.name}. Gunakan sebagai acuan sebelum menetapkan jadwal final.</p>
                </div>
                <button type="button" className="btn-secondary btn-sm" onClick={applyRequestedSchedules} disabled={!requestHasSchedule}>
                  Terapkan ke Jadwal
                </button>
              </div>
              <div className={`parent-request-rule ${requestCoversProgram ? 'is-complete' : 'is-incomplete'}`}>
                <span>Kebutuhan program</span>
                <strong>{requiredScheduleCount} hari belajar / minggu</strong>
                <small>{requestCoversProgram ? `${applicableRequestedSchedules.length} hari pilihan sudah mencukupi.` : `${applicableRequestedSchedules.length} hari diminta orang tua. Admin perlu melengkapi ${Math.max(0, requiredScheduleCount - applicableRequestedSchedules.length)} hari lainnya.`}</small>
              </div>
              <div className="parent-request-slots">
                {requestedSchedules.length > 0 ? requestedSchedules.map((schedule, index) => (
                  <span className="parent-request-slot" key={`${schedule.day}-${schedule.time ?? index}`}>
                    <strong>{schedule.day}</strong>
                    <small>{schedule.time ? `${schedule.time.replace('.', ':')} WIB` : 'Jam fleksibel'}</small>
                  </span>
                )) : <span className="parent-request-empty">Orang tua belum memilih hari dan jam.</span>}
              </div>
              <div className="parent-request-note">
                <span>Catatan orang tua</span>
                <p>{registration.notes?.trim() || 'Tidak ada catatan tambahan.'}</p>
              </div>
            </section>
          )}

          <div className="final-schedule-label">
            <span>Jadwal final murid</span>
            <small className={form.schedules.length === requiredScheduleCount ? 'is-complete' : 'is-incomplete'}>{form.schedules.length}/{requiredScheduleCount} hari - {form.schedules.length === requiredScheduleCount ? 'sesuai program' : 'belum lengkap'}</small>
          </div>
          <div className="student-schedule-fields">
            {form.schedules.length === 0 && <div className="student-schedule-empty">Belum ada jadwal final. Terapkan permintaan orang tua atau tambahkan jadwal secara manual.</div>}
            {form.schedules.map((sched, i) => (
              <div className="student-schedule-field" key={`${sched.day}-${i}`}>
                <select aria-label={`Hari jadwal ${i + 1}`} className="input-field" value={sched.day} onChange={(e) => updateSchedule(i, 'day', e.target.value)}>
                  {ALL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <select aria-label={`Jam jadwal ${i + 1}`} className="input-field" value={sched.time} onChange={(e) => updateSchedule(i, 'time', e.target.value)}>
                  {getTimesForDay(sched.day).map((time) => <option key={time} value={time}>{time} WIB</option>)}
                </select>
                {form.schedules.length > 1 && <button type="button" className="btn-danger btn-sm" onClick={() => setForm((current) => ({ ...current, schedules: current.schedules.filter((_, index) => index !== i) }))}>Hapus</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="card"><div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Keterangan Tambahan</div><textarea aria-label="Keterangan tambahan" className="input-field" rows={5} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
      </div>
    </div>
  );
}

function StudentDetail({ student, teachers, programs, onEdit, onBack, canManage }: { student: Student; teachers: Teacher[]; programs: Program[]; onEdit: () => void; onBack: () => void; canManage: boolean }) {
  const program = programs.find((item) => item.id === student.programId);
  const teacher = teachers.find((item) => item.id === student.teacherId);
  const details = [
    ['Nama Orang Tua', student.parentName],
    ['Tempat, Tanggal Lahir', `${student.birthPlace || '-'}${student.birthDate ? `, ${formatDate(student.birthDate)}` : ''}`],
    ['Alamat', student.address],
    ['No. Telepon', student.phone],
    ['Tanggal Masuk', formatDate(student.joinDate)],
    ['Masa Paket', student.packageStartedAt && student.packageEndsAt ? `${formatDate(student.packageStartedAt)} - ${formatDate(student.packageEndsAt)}` : 'Belum ditentukan'],
    ['Tanggal Off', student.leaveDate ? formatDate(student.leaveDate) : '-'],
  ];

  return (
    <div className="entity-detail-page student-detail-page">
      <div className="page-header detail-page-actions">
        <button className="btn-secondary" onClick={onBack}>Kembali</button>
        {canManage && <button className="btn-primary" onClick={onEdit}>Edit Murid</button>}
      </div>
      <div className="entity-detail-grid">
        <section className="card entity-profile-card">
          <div className="entity-profile-head">
            <div className="entity-avatar student-entity-avatar" style={student.photo ? { backgroundImage: `url(${student.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>{student.fullName.charAt(0)}</div>
            <div className="entity-profile-copy">
              <h2>{student.fullName}</h2>
              <p>ID: {student.id}</p>
              <span className={'badge badge-' + student.status}>{student.status === 'active' ? 'Aktif' : 'Off'}</span>
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
          <div className="section-title entity-section-title">Program & Jadwal</div>
          <div className="entity-highlight">
            <span className="entity-highlight-label">Program Aktif</span>
            <strong>{program?.name ?? '-'}</strong>
            <b>{formatCurrency(program?.price ?? 0)} / bulan</b>
            <p>{student.sessionsPerWeek} sesi per minggu · Guru {teacher?.fullName ?? '-'}</p>
            {student.currentLevel && <p>Level {student.currentLevel} · evaluasi setiap {student.levelDurationMonths ?? '-'} bulan</p>}
            {student.packageSelections && student.packageSelections.length > 1 && <p>{student.packageSelections.length} program dalam paket pendaftaran</p>}
          </div>
          <div className="entity-schedule-grid">
            {student.schedules.map((schedule, index) => (
              <div className="entity-schedule-item" key={index}>
                <strong>{schedule.day}</strong>
                <span>{schedule.time} WIB</span>
              </div>
            ))}
          </div>
          <div className="status-history-list"><div className="section-title entity-section-title">Riwayat Status</div>{student.statusHistory.map((history, index) => <div key={`${history.date}-${index}`}><i className={history.action} /><span><strong>{history.action === 'activated' ? 'Aktif' : 'Off'} - {formatDate(history.date)}</strong><small>{history.reason ?? `oleh ${history.by}`}</small></span></div>)}</div>
        </section>
      </div>
    </div>
  );
}

function StudentActivation({ students, teachers, programs, setStudents, canManage }: { students: Student[]; teachers: Teacher[]; programs: Program[]; setStudents: (s: Student[]) => void; canManage: boolean }) {
  const { notify } = useToast();
  const [modal, setModal] = useState<{ student: Student; action: 'off' | 'activate' } | null>(null);
  const [reason, setReason] = useState('');
  const [offDate, setOffDate] = useState(new Date().toISOString().slice(0, 10));
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
  const openAction = (student: Student, action: 'off' | 'activate') => { setReason(''); setOffDate(new Date().toISOString().slice(0, 10)); setModal({ student, action }); };
  const doAction = () => {
    if (!modal) return;
    if (modal.action === 'off' && !reason.trim()) {
      notify({ tone: 'error', title: 'Alasan belum diisi', message: 'Tuliskan alasan agar riwayat status murid tetap lengkap.' });
      return;
    }
    setStudents(students.map((student) => student.id !== modal.student.id ? student : { ...student, status: modal.action === 'off' ? 'off' : 'active', leaveDate: modal.action === 'off' ? offDate : undefined, statusHistory: [...student.statusHistory, { date: offDate, action: modal.action === 'off' ? 'deactivated' : 'activated', reason: reason.trim() || undefined, by: 'Admin' }] }));
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
        <select className="input-field" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><option value="all">Semua Program</option>{programs.map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select>
        <span>{filtered.length} murid ditemukan</span>
      </div>
      <div className="status-table-shell">
        <table className="status-student-table">
          <thead><tr><th>Murid</th><th>Program & Guru</th><th>Tanggal Masuk</th><th>Tanggal Off</th><th>Status Terakhir</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="status-empty">Tidak ada murid yang sesuai dengan filter.</td></tr>}
            {visibleStatusStudents.map((student, rowIndex) => {
              const program = programs.find((item) => item.id === student.programId);
              const teacher = teachers.find((item) => item.id === student.teacherId);
              const lastHistory = student.statusHistory[student.statusHistory.length - 1];
              return <tr key={student.id}><td><div className="status-student-name"><span className="table-row-number">{statusPageStart + rowIndex + 1}</span><span>{student.fullName.charAt(0)}</span><div><strong>{student.fullName}</strong><small>{student.parentName}</small></div></div></td><td><strong>{program?.name ?? '-'}</strong><small>{teacher?.fullName ?? '-'}</small></td><td><strong>{formatDate(student.joinDate)}</strong><small>{student.packageEndsAt ? `Paket s.d. ${formatDate(student.packageEndsAt)}` : 'Masa paket belum diatur'}</small></td><td><strong>{student.leaveDate ? formatDate(student.leaveDate) : '-'}</strong><small>{student.leaveDate ? 'Tanggal berhenti' : 'Masih bergabung'}</small></td><td><div className={`history-line history-${lastHistory.action}`}><i /><span><strong>{lastHistory.action === 'activated' ? 'Diaktifkan' : 'Dinonaktifkan'} {formatDate(lastHistory.date)}</strong><small>{lastHistory.reason ?? `oleh ${lastHistory.by}`}</small></span></div></td><td><span className={`status-pill status-pill-${student.status}`}><i />{student.status === 'active' ? 'Aktif' : 'Off'}</span></td><td>{canManage ? (student.status === 'active' ? <button type="button" className="status-action status-action-off" onClick={() => openAction(student, 'off')}>Nonaktifkan</button> : <button type="button" className="status-action status-action-on" onClick={() => openAction(student, 'activate')}>Aktifkan</button>) : <span className="read-only-label">Lihat saja</span>}</td></tr>;
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
  canManage = true,
  students: controlledStudents,
  onStudentsChange: controlledStudentsChange,
  viewStudentId,
  editStudentId,
  initialView,
  teachers = TEACHERS,
  programs = PROGRAMS,
  registrations = [],
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
  const selectedRegistration = [...registrations]
    .filter((registration) => registration.studentId === selectedStudent?.id)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())[0];
  const handleNavigate = (page: Page, id?: string) => { if (page === 'student-form') { setSubPage('form'); setSelectedId(id); } else if (page === 'student-detail') { setSubPage('detail'); setSelectedId(id); } else if (page === 'student-activation') setSubPage('activation'); };
  const handleSave = (data: Partial<Student>) => { const isEditing = Boolean(selectedId); if (selectedId) onStudentsChange(students.map((s) => s.id === selectedId ? { ...s, ...data } : s)); else onStudentsChange([...students, { id: `S${String(students.length + 1).padStart(3, '0')}`, status: 'active', statusHistory: [{ date: '2026-07-31', action: 'activated', by: 'Admin' }], ...(data as Omit<Student, 'id' | 'status' | 'statusHistory'>) }]); notify({ tone: 'success', title: isEditing ? 'Data murid diperbarui' : 'Murid baru ditambahkan', message: `${data.fullName ?? 'Data murid'} berhasil disimpan.` }); setSubPage('list'); setSelectedId(undefined); };
  if (subPage === 'activation') return <StudentActivation students={students} teachers={teachers} programs={programs} setStudents={onStudentsChange} canManage={canManage} />;
  if (subPage === 'form' && canManage) return <StudentForm student={selectedStudent} registration={selectedRegistration} teachers={teachers} programs={programs} onSave={handleSave} onCancel={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  if (subPage === 'detail' && selectedStudent) return <StudentDetail student={selectedStudent} teachers={teachers} programs={programs} canManage={canManage} onEdit={() => setSubPage('form')} onBack={() => { setSubPage('list'); setSelectedId(undefined); }} />;
  return <StudentList onNavigate={handleNavigate} students={students} teachers={teachers} programs={programs} canManage={canManage} />;
}
