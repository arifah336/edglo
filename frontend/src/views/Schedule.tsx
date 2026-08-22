import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  ALL_DAYS,
  PROGRAMS,
  STUDENTS,
  TEACHERS,
  getProgramById,
  getTimesForDay,
} from '../data/mockData';
import type { ClassSession, Student } from '../types';
import { createClassSessions } from '../data/scheduleState';
import { useToast } from '../components/ui/ToastProvider';
import ScheduleTable from '../components/schedule/ScheduleTable';

const activeTeachers = TEACHERS.filter((teacher) => teacher.status === 'active');

const DAY_THEME: Record<string, { color: string; soft: string; short: string }> = {
  Senin: { color: '#1687A7', soft: '#E7F5F8', short: 'Sen' },
  Selasa: { color: '#397FC4', soft: '#EAF2FC', short: 'Sel' },
  Rabu: { color: '#1A9C72', soft: '#E7F7F1', short: 'Rab' },
  Kamis: { color: '#B67A08', soft: '#FFF4D9', short: 'Kam' },
  Jumat: { color: '#7A59B0', soft: '#F1ECF8', short: 'Jum' },
  Sabtu: { color: '#D94B5C', soft: '#FCECEF', short: 'Sab' },
};

type ScheduleForm = Omit<ClassSession, 'id'>;

type Props = {
  students?: Student[];
  sessions?: ClassSession[];
  onSessionsChange?: (sessions: ClassSession[]) => void;
};

function ScheduleIcon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function createEmptyForm(day = 'Senin'): ScheduleForm {
  return {
    day,
    time: getTimesForDay(day)[0],
    teacherId: activeTeachers[0]?.id ?? '',
    programId: PROGRAMS[0]?.id ?? '',
    studentIds: [],
    room: 'Ruang A',
    capacity: 6,
    notes: '',
  };
}

function nextSessionId(sessions: ClassSession[]) {
  const largest = sessions.reduce((max, session) => {
    const numericId = Number(session.id.replace(/\D/g, ''));
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0);
  return `CLS${String(largest + 1).padStart(3, '0')}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.replace('.', ':').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export default function Schedule(props: Props = {}) {
  const { notify } = useToast();
  const students = props.students ?? STUDENTS;
  const [fallbackSessions, setFallbackSessions] = useState<ClassSession[]>(() => createClassSessions(STUDENTS));
  const sessions = props.sessions ?? fallbackSessions;
  const onSessionsChange = props.onSessionsChange ?? setFallbackSessions;
  const activeStudents = students.filter((student) => student.status === 'active');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [editor, setEditor] = useState<{ mode: 'add' | 'edit'; sessionId?: string } | null>(null);
  const [form, setForm] = useState<ScheduleForm>(() => createEmptyForm());
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ClassSession | null>(null);

  const visibleDays = dayFilter === 'all' ? ALL_DAYS : [dayFilter];
  const filteredSessions = sessions.filter((session) => {
    if (teacherFilter !== 'all' && session.teacherId !== teacherFilter) return false;
    if (dayFilter !== 'all' && session.day !== dayFilter) return false;
    if (search) {
      const teacher = TEACHERS.find((item) => item.id === session.teacherId)?.fullName ?? '';
      const program = getProgramById(session.programId)?.name ?? '';
      const query = search.toLowerCase();
      if (![teacher, program, session.room, session.day, session.time].some((value) => value.toLowerCase().includes(query))) return false;
    }
    return true;
  });
  const eligibleStudents = activeStudents.filter((student) => student.programId === form.programId);
  const usedTeacherCount = new Set(sessions.map((session) => session.teacherId)).size;
  const totalAssignments = sessions.reduce((sum, session) => sum + session.studentIds.length, 0);
  const occupiedSlots = new Set(sessions.map((session) => `${session.day}|${session.time}`)).size;

  const teacherWorkload = activeTeachers.map((teacher) => {
    const teacherSessions = sessions.filter((session) => session.teacherId === teacher.id);
    return {
      teacher,
      classCount: teacherSessions.length,
      studentCount: teacherSessions.reduce((sum, session) => sum + session.studentIds.length, 0),
      days: new Set(teacherSessions.map((session) => session.day)).size,
    };
  });

  const openAdd = (day = dayFilter === 'all' ? 'Senin' : dayFilter) => {
    setForm(createEmptyForm(day));
    setFormError('');
    setEditor({ mode: 'add' });
  };

  const openEdit = (session: ClassSession) => {
    setForm({
      day: session.day,
      time: session.time,
      teacherId: session.teacherId,
      programId: session.programId,
      studentIds: [...session.studentIds],
      room: session.room,
      capacity: session.capacity,
      notes: session.notes ?? '',
    });
    setFormError('');
    setEditor({ mode: 'edit', sessionId: session.id });
  };

  const updateDay = (day: string) => {
    setForm((current) => ({
      ...current,
      day,
    }));
    setFormError('');
  };

  const updateProgram = (programId: string) => {
    setForm((current) => ({
      ...current,
      programId,
      studentIds: current.studentIds.filter(
        (studentId) => students.find((student) => student.id === studentId)?.programId === programId,
      ),
    }));
    setFormError('');
  };

  const toggleStudent = (studentId: string) => {
    setForm((current) => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter((id) => id !== studentId)
        : [...current.studentIds, studentId],
    }));
  };

  const saveSession = () => {
    if (!form.teacherId || !form.programId || !form.day || !form.time || !form.room.trim()) {
      setFormError('Lengkapi hari, jam, guru, program, dan ruang kelas.');
      return;
    }

    if (form.capacity < 1) {
      setFormError('Kapasitas kelas minimal 1 murid.');
      return;
    }

    if (form.studentIds.length > form.capacity) {
      setFormError('Jumlah murid melebihi kapasitas kelas.');
      return;
    }

    const conflict = sessions.find(
      (session) =>
        session.id !== editor?.sessionId &&
        session.day === form.day &&
        session.time === form.time &&
        session.teacherId === form.teacherId,
    );

    if (conflict) {
      const teacher = TEACHERS.find((item) => item.id === form.teacherId);
      setFormError(
        `${teacher?.fullName ?? 'Guru'} sudah memiliki kelas pada ${form.day}, pukul ${form.time} WIB.`,
      );
      return;
    }

    const studentConflict = sessions.find(
      (session) =>
        session.id !== editor?.sessionId &&
        session.day === form.day &&
        session.time === form.time &&
        session.studentIds.some((studentId) => form.studentIds.includes(studentId)),
    );

    if (studentConflict) {
      const conflictedStudent = students.find((student) =>
        studentConflict.studentIds.some(
          (studentId) => studentId === student.id && form.studentIds.includes(studentId),
        ),
      );
      setFormError(
        `${conflictedStudent?.fullName ?? 'Murid'} sudah terdaftar di kelas lain pada ${form.day}, pukul ${form.time} WIB.`,
      );
      return;
    }

    const cleanForm = { ...form, room: form.room.trim(), notes: form.notes?.trim() };
    if (editor?.mode === 'edit' && editor.sessionId) {
      onSessionsChange(
        sessions.map((session) =>
          session.id === editor.sessionId ? { ...session, ...cleanForm } : session,
        ),
      );
    } else {
      onSessionsChange([
        ...sessions,
        { id: nextSessionId(sessions), ...cleanForm },
      ]);
    }

    setEditor(null);
    setFormError('');
    notify({ tone: 'success', title: editor?.mode === 'edit' ? 'Jadwal diperbarui' : 'Kelas ditambahkan', message: `${form.day}, ${form.time} WIB berhasil disimpan.` });
  };

  const removeSession = () => {
    if (!deleteTarget) return;
    onSessionsChange(sessions.filter((session) => session.id !== deleteTarget.id));
    notify({ tone: 'warning', title: 'Kelas dihapus', message: `${deleteTarget.day}, ${deleteTarget.time} WIB dihapus dari jadwal.` });
    setDeleteTarget(null);
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-heading">
        <div>
          <span className="eyebrow">PENGELOLAAN KELAS</span>
          <h2>Atur jadwal mengajar mingguan</h2>
          <p>Kelola jam kelas, guru pengajar, program, ruang, dan murid dalam setiap sesi.</p>
        </div>
        <button type="button" className="btn-primary schedule-add-main" onClick={() => openAdd()}>
          <ScheduleIcon size={17}><path d="M12 5v14M5 12h14" /></ScheduleIcon>
          Tambah Kelas
        </button>
      </div>

      <div className="schedule-summary-grid">
        <div className="schedule-summary-card">
          <span className="schedule-summary-icon teal"><ScheduleIcon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></ScheduleIcon></span>
          <div><span>Total Kelas</span><strong>{sessions.length}</strong><small>Sesi aktif per minggu</small></div>
        </div>
        <div className="schedule-summary-card">
          <span className="schedule-summary-icon blue"><ScheduleIcon><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></ScheduleIcon></span>
          <div><span>Guru Mengajar</span><strong>{usedTeacherCount}</strong><small>Dari {activeTeachers.length} guru aktif</small></div>
        </div>
        <div className="schedule-summary-card">
          <span className="schedule-summary-icon green"><ScheduleIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></ScheduleIcon></span>
          <div><span>Penempatan Murid</span><strong>{totalAssignments}</strong><small>Dalam seluruh kelas</small></div>
        </div>
        <div className="schedule-summary-card">
          <span className="schedule-summary-icon yellow"><ScheduleIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></ScheduleIcon></span>
          <div><span>Slot Terisi</span><strong>{occupiedSlots}</strong><small>Hari dan jam berbeda</small></div>
        </div>
      </div>

      <div className="schedule-viewbar">
        <div className="schedule-view-switch" aria-label="Tampilan jadwal">
          <button type="button" className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Kalender Mingguan</button>
          <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>Daftar Kelas</button>
        </div>
        <p>{viewMode === 'calendar' ? 'Lihat susunan kelas berdasarkan hari.' : 'Kelola semua kelas melalui tabel.'}</p>
      </div>

      <div className="schedule-toolbar">
        <label className="schedule-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kelas, guru, ruang..." /></label>
        <div className="schedule-filter">
          <label htmlFor="schedule-teacher-filter">Guru</label>
          <select id="schedule-teacher-filter" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
            <option value="all">Semua Guru</option>
            {activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
          </select>
        </div>
        <div className="schedule-filter">
          <label htmlFor="schedule-day-filter">Hari</label>
          <select id="schedule-day-filter" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
            <option value="all">Semua Hari</option>
            {ALL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
        {(teacherFilter !== 'all' || dayFilter !== 'all' || search) && (
          <button
            type="button"
            className="schedule-reset"
            onClick={() => {
              setTeacherFilter('all');
              setDayFilter('all');
              setSearch('');
            }}
          >
            Reset Filter
          </button>
        )}
        <span className="schedule-toolbar-count">{filteredSessions.length} kelas ditampilkan</span>
      </div>

      {viewMode === 'calendar' && <div className={`weekly-board${dayFilter !== 'all' ? ' single-day' : ''}`}>
        {visibleDays.map((day) => {
          const theme = DAY_THEME[day];
          const daySessions = filteredSessions
            .filter((session) => session.day === day)
            .sort(
              (a, b) =>
                timeToMinutes(a.time) - timeToMinutes(b.time),
            );

          return (
            <section className="day-column" key={day} style={{ '--day-color': theme.color, '--day-soft': theme.soft } as CSSProperties}>
              <header className="day-column-header">
                <div>
                  <span>{theme.short}</span>
                  <div><strong>{day}</strong><small>{daySessions.length} kelas</small></div>
                </div>
                <button type="button" onClick={() => openAdd(day)} title={`Tambah kelas ${day}`} aria-label={`Tambah kelas ${day}`}>
                  <ScheduleIcon size={16}><path d="M12 5v14M5 12h14" /></ScheduleIcon>
                </button>
              </header>

              <div className="day-session-list">
                {daySessions.length === 0 ? (
                  <button type="button" className="empty-day" onClick={() => openAdd(day)}>
                    <ScheduleIcon size={20}><path d="M12 5v14M5 12h14" /></ScheduleIcon>
                    <span>Belum ada kelas</span>
                    <small>Tambah jadwal</small>
                  </button>
                ) : (
                  daySessions.map((session) => {
                    const teacher = TEACHERS.find((item) => item.id === session.teacherId);
                    const program = getProgramById(session.programId);
                    const isFull = session.studentIds.length >= session.capacity;
                    const classStudents = session.studentIds
                      .map((studentId) => students.find((student) => student.id === studentId))
                      .filter((student): student is Student => Boolean(student));

                    return (
                      <article className="class-session-card" key={session.id}>
                        <div className="class-session-top">
                          <span className="class-time">
                            <ScheduleIcon size={14}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></ScheduleIcon>
                            {session.time}
                          </span>
                          <div className="class-actions">
                            <button type="button" onClick={() => openEdit(session)} title="Edit kelas" aria-label="Edit kelas">
                              <ScheduleIcon size={15}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></ScheduleIcon>
                            </button>
                            <button type="button" className="delete" onClick={() => setDeleteTarget(session)} title="Hapus kelas" aria-label="Hapus kelas">
                              <ScheduleIcon size={15}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></ScheduleIcon>
                            </button>
                          </div>
                        </div>
                        <h3>{program?.name ?? 'Program belum dipilih'}</h3>
                        <div className="class-teacher">
                          <span>{teacher?.fullName.charAt(0) ?? '?'}</span>
                          <div><small>Guru</small><strong>{teacher?.fullName ?? '-'}</strong></div>
                        </div>
                        <div className="class-meta">
                          <span><ScheduleIcon size={14}><path d="M3 21h18M5 21V5h14v16M9 9h2M13 9h2M9 13h2M13 13h2" /></ScheduleIcon>{session.room}</span>
                          <span className={isFull ? 'full' : ''}><ScheduleIcon size={14}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="9" cy="7" r="4" /></ScheduleIcon>{session.studentIds.length}/{session.capacity}</span>
                        </div>
                        <div className="class-capacity">
                          <span style={{ width: `${Math.min((session.studentIds.length / Math.max(session.capacity, 1)) * 100, 100)}%` }} />
                        </div>
                        <div className="class-student-list">
                          {classStudents.length === 0 ? (
                            <span>Belum ada murid</span>
                          ) : (
                            <>
                              {classStudents.slice(0, 3).map((student) => (
                                <span key={student.id}>{student.fullName}</span>
                              ))}
                              {classStudents.length > 3 && <strong>+{classStudents.length - 3} murid</strong>}
                            </>
                          )}
                        </div>
                        {session.notes && <p className="class-note">{session.notes}</p>}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>}

      {viewMode === 'list' && <ScheduleTable sessions={filteredSessions.slice().sort((a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day) || timeToMinutes(a.time) - timeToMinutes(b.time))} students={students} teachers={activeTeachers} onEdit={openEdit} onDelete={setDeleteTarget} />}

      <section className="teacher-workload-panel">
        <div className="teacher-workload-header">
          <div>
            <span className="panel-kicker">BEBAN MENGAJAR</span>
            <h3>Ringkasan jadwal guru</h3>
            <p>Jumlah kelas, hari mengajar, dan penempatan murid per minggu.</p>
          </div>
        </div>
        <div className="teacher-workload-grid">
          {teacherWorkload.map(({ teacher, classCount, studentCount, days }, index) => (
            <div className="teacher-workload-card" key={teacher.id}>
              <span className={`teacher-workload-avatar avatar-${index % 5}`}>{teacher.fullName.charAt(0)}</span>
              <div className="teacher-workload-name"><strong>{teacher.fullName}</strong><span>{teacher.employmentType}</span></div>
              <div><strong>{classCount}</strong><span>Kelas</span></div>
              <div><strong>{days}</strong><span>Hari</span></div>
              <div><strong>{studentCount}</strong><span>Murid</span></div>
            </div>
          ))}
        </div>
      </section>

      {editor && (
        <div className="modal-overlay">
          <div className="modal-box schedule-editor-modal">
            <div className="schedule-modal-header">
              <div>
                <span className="eyebrow">{editor.mode === 'edit' ? 'EDIT JADWAL' : 'KELAS BARU'}</span>
                <h2>{editor.mode === 'edit' ? 'Edit kelas' : 'Tambah kelas'}</h2>
                <p>Atur waktu, guru, program, dan peserta kelas.</p>
              </div>
              <button type="button" onClick={() => setEditor(null)} aria-label="Tutup">
                <ScheduleIcon size={20}><path d="m6 6 12 12M18 6 6 18" /></ScheduleIcon>
              </button>
            </div>

            <div className="schedule-form-grid">
              <div>
                <label className="input-label">Hari *</label>
                <select className="input-field" value={form.day} onChange={(event) => updateDay(event.target.value)}>
                  {ALL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Jam *</label>
                <input className="input-field" type="time" step={300} value={form.time.replace('.', ':')} onChange={(event) => { setForm((current) => ({ ...current, time: event.target.value.replace(':', '.') })); setFormError(''); }} />
                <div className="schedule-time-presets"><span>Jam rekomendasi:</span>{getTimesForDay(form.day).map((time) => <button type="button" className={form.time === time ? 'active' : ''} key={time} onClick={() => setForm((current) => ({ ...current, time }))}>{time}</button>)}</div>
              </div>
              <div>
                <label className="input-label">Guru *</label>
                <select className="input-field" value={form.teacherId} onChange={(event) => { setForm((current) => ({ ...current, teacherId: event.target.value })); setFormError(''); }}>
                  {activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Program *</label>
                <select className="input-field" value={form.programId} onChange={(event) => updateProgram(event.target.value)}>
                  {PROGRAMS.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Ruang Kelas *</label>
                <input className="input-field" value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} placeholder="Contoh: Ruang A" />
              </div>
              <div>
                <label className="input-label">Kapasitas *</label>
                <input className="input-field" type="number" min={1} max={20} value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) }))} />
              </div>
            </div>

            <div className="schedule-participants">
              <div className="schedule-participants-header">
                <div><strong>Murid Kelas</strong><span>Pilih murid dari program yang sama</span></div>
                <span>{form.studentIds.length}/{form.capacity} dipilih</span>
              </div>
              {eligibleStudents.length === 0 ? (
                <div className="schedule-participants-empty">Belum ada murid aktif pada program ini.</div>
              ) : (
                <div className="schedule-participant-grid">
                  {eligibleStudents.map((student) => {
                    const selected = form.studentIds.includes(student.id);
                    return (
                      <label className={`schedule-participant${selected ? ' selected' : ''}`} key={student.id}>
                        <input type="checkbox" checked={selected} onChange={() => toggleStudent(student.id)} disabled={!selected && form.studentIds.length >= form.capacity} />
                        <span>{student.fullName.charAt(0)}</span>
                        <div><strong>{student.fullName}</strong><small>{student.parentName}</small></div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="input-label">Catatan</label>
              <textarea className="input-field" rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Catatan tambahan untuk kelas ini..." />
            </div>

            {formError && <div className="schedule-form-error">{formError}</div>}

            <div className="schedule-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Batal</button>
              <button type="button" className="btn-primary" onClick={saveSession}>
                <ScheduleIcon size={16}><path d="m20 6-11 11-5-5" /></ScheduleIcon>
                Simpan Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-box schedule-delete-modal">
            <span className="schedule-delete-icon"><ScheduleIcon size={24}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></ScheduleIcon></span>
            <h2>Hapus kelas?</h2>
            <p>
              Kelas {getProgramById(deleteTarget.programId)?.name} pada {deleteTarget.day}, pukul {deleteTarget.time} WIB akan dihapus.
            </p>
            <div className="schedule-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button type="button" className="btn-danger" onClick={removeSession}>Hapus Kelas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
