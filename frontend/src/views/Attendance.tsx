'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck2, CalendarClock, CheckCircle2, ClipboardX, Plus, Trash2, X } from 'lucide-react';
import type { ClassSession, MakeUpSchedule, Student, StudentAbsence, Teacher, TeacherAttendance, UserRole } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { formatDate } from '../data/mockData';

type Props = {
  role: UserRole;
  students: Student[];
  teachers: Teacher[];
  sessions: ClassSession[];
  teacherAttendances: TeacherAttendance[];
  studentAbsences: StudentAbsence[];
  makeUpSchedules: MakeUpSchedule[];
  onSaveTeacherAttendance: (data: Partial<TeacherAttendance>) => Promise<void>;
  onDeleteTeacherAttendance: (id: string) => Promise<void>;
  onSaveStudentAbsence: (data: Partial<StudentAbsence>) => Promise<void>;
  onDeleteStudentAbsence: (id: string) => Promise<void>;
  onSaveMakeUpSchedule: (data: Partial<MakeUpSchedule>, id?: string) => Promise<void>;
  onDeleteMakeUpSchedule: (id: string) => Promise<void>;
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const REPLACEMENT_TIMES = ['09:00', '10:30', '11:00', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const today = new Date().toISOString().slice(0, 10);

export default function Attendance({ role, students, teachers, sessions, teacherAttendances, studentAbsences, makeUpSchedules, onSaveTeacherAttendance, onDeleteTeacherAttendance, onSaveStudentAbsence, onDeleteStudentAbsence, onSaveMakeUpSchedule, onDeleteMakeUpSchedule }: Props) {
  const { notify } = useToast();
  const canManage = role === 'admin';
  const [tab, setTab] = useState<'teacher' | 'student' | 'makeup'>('teacher');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ classSessionId: sessions[0]?.id ?? '', attendanceDate: today, status: 'present' as TeacherAttendance['status'], notes: '' });
  const [absenceForm, setAbsenceForm] = useState({ classSessionId: sessions[0]?.id ?? '', studentId: '', absenceDate: today, reason: '' });
  const [makeUpModal, setMakeUpModal] = useState<StudentAbsence | null>(null);
  const [makeUpForm, setMakeUpForm] = useState({ scheduledDate: today, time: '15.00', room: 'Ruang 1', notes: '' });

  const inPeriod = (date: string) => {
    const value = new Date(`${date}T00:00:00`);
    return value.getMonth() + 1 === month && value.getFullYear() === year;
  };
  const periodTeacherAttendances = teacherAttendances.filter((item) => inPeriod(item.attendanceDate));
  const periodAbsences = studentAbsences.filter((item) => inPeriod(item.absenceDate));
  const periodMakeUps = makeUpSchedules.filter((item) => inPeriod(item.scheduledDate));
  const selectedTeacherSession = sessions.find((item) => item.id === teacherForm.classSessionId);
  const selectedAbsenceSession = sessions.find((item) => item.id === absenceForm.classSessionId);
  const sessionStudents = students.filter((student) => selectedAbsenceSession?.studentIds.includes(student.id));
  const teacherName = (id?: string) => teachers.find((teacher) => teacher.id === id)?.fullName ?? '-';
  const studentName = (id?: string) => students.find((student) => student.id === id)?.fullName ?? '-';
  const sessionLabel = (session: ClassSession) => `${session.day}, ${session.time} - ${teacherName(session.teacherId)} - ${session.room}`;
  const openAbsences = useMemo(() => studentAbsences.filter((absence) => absence.status === 'open' && !absence.makeUpSchedule), [studentAbsences]);
  const availableTimes = (absence: StudentAbsence, date: string) => {
    const teacherId = absence.session?.teacherId ?? sessions.find((item) => item.id === absence.classSessionId)?.teacherId;
    if (!teacherId || !date) return REPLACEMENT_TIMES;
    const day = DAYS[new Date(`${date}T00:00:00`).getDay()];
    const occupied = new Set([
      ...sessions.filter((item) => item.teacherId === teacherId && item.day === day).map((item) => item.time.replace('.', ':')),
      ...makeUpSchedules.filter((item) => item.teacherId === teacherId && item.scheduledDate === date && item.status !== 'cancelled').map((item) => item.time.replace('.', ':')),
    ]);
    return REPLACEMENT_TIMES.filter((time) => !occupied.has(time));
  };
  const makeUpTimeOptions = makeUpModal ? availableTimes(makeUpModal, makeUpForm.scheduledDate) : [];
  const openMakeUpEditor = (absence: StudentAbsence) => {
    const slots = availableTimes(absence, today);
    setMakeUpModal(absence);
    setMakeUpForm({ scheduledDate: today, time: slots[0] ?? '', room: absence.session?.room ?? 'Ruang 1', notes: '' });
  };

  const run = async (action: () => Promise<void>, success: string) => {
    setSaving(true);
    try {
      await action();
      notify({ tone: 'success', title: success, message: 'Data backend berhasil diperbarui.' });
    } catch (error) {
      notify({ tone: 'error', title: 'Data gagal disimpan', message: error instanceof Error ? error.message : 'Permintaan gagal.' });
    } finally {
      setSaving(false);
    }
  };

  const saveTeacherAttendance = () => {
    if (!selectedTeacherSession) return;
    void run(() => onSaveTeacherAttendance({ ...teacherForm, teacherId: selectedTeacherSession.teacherId }), 'Absensi guru tersimpan');
  };
  const saveAbsence = () => {
    if (!absenceForm.studentId || !absenceForm.classSessionId) return;
    void run(() => onSaveStudentAbsence(absenceForm), 'Ketidakhadiran murid tercatat');
  };
  const saveMakeUp = () => {
    if (!makeUpModal || !makeUpForm.time) return;
    void run(async () => {
      await onSaveMakeUpSchedule({ studentAbsenceId: makeUpModal.id, ...makeUpForm });
      setMakeUpModal(null);
    }, 'Jadwal pengganti dibuat');
  };

  return (
    <div className="attendance-page">
      <div className="module-heading">
        <div><span className="eyebrow">KEHADIRAN & PENGGANTI</span><h2>Kontrol sesi belajar</h2><p>Rekap kehadiran guru, ketidakhadiran murid, dan jadwal pengganti dalam satu periode.</p></div>
        <div className="period-controls"><select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select><select value={year} onChange={(event) => setYear(Number(event.target.value))}>{[2025, 2026, 2027].map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>

      <div className="attendance-summary-grid">
        <article><CalendarCheck2 size={20} /><span>Guru hadir</span><strong>{periodTeacherAttendances.filter((item) => item.status === 'present').length}</strong><small>Sesi tercatat</small></article>
        <article><ClipboardX size={20} /><span>Murid tidak hadir</span><strong>{periodAbsences.length}</strong><small>Hanya pengecualian</small></article>
        <article><CalendarClock size={20} /><span>Menunggu pengganti</span><strong>{openAbsences.length}</strong><small>Perlu penjadwalan</small></article>
        <article><CheckCircle2 size={20} /><span>Pengganti selesai</span><strong>{periodMakeUps.filter((item) => item.status === 'completed').length}</strong><small>Periode terpilih</small></article>
      </div>

      <div className="segmented-tabs attendance-tabs" role="tablist">
        <button className={tab === 'teacher' ? 'active' : ''} onClick={() => setTab('teacher')}>Absensi Guru</button>
        <button className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>Murid Tidak Hadir</button>
        <button className={tab === 'makeup' ? 'active' : ''} onClick={() => setTab('makeup')}>Jadwal Pengganti</button>
      </div>

      {tab === 'teacher' && <section className="operation-panel">
        {canManage && <div className="operation-form attendance-form"><label>Sesi kelas<select value={teacherForm.classSessionId} onChange={(event) => setTeacherForm((form) => ({ ...form, classSessionId: event.target.value }))}>{sessions.map((session) => <option key={session.id} value={session.id}>{sessionLabel(session)}</option>)}</select></label><label>Tanggal<input type="date" value={teacherForm.attendanceDate} onChange={(event) => setTeacherForm((form) => ({ ...form, attendanceDate: event.target.value }))} /></label><label>Status<select value={teacherForm.status} onChange={(event) => setTeacherForm((form) => ({ ...form, status: event.target.value as TeacherAttendance['status'] }))}><option value="present">Hadir</option><option value="absent">Tidak hadir</option><option value="excused">Izin</option></select></label><label>Keterangan<input value={teacherForm.notes} onChange={(event) => setTeacherForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Opsional" /></label><button className="btn-primary" disabled={saving || !teacherForm.classSessionId} onClick={saveTeacherAttendance}><Plus size={16} />Simpan</button></div>}
        <div className="data-table-wrap"><table className="operation-table"><thead><tr><th>No.</th><th>Tanggal</th><th>Guru</th><th>Sesi</th><th>Status</th><th>Dicatat oleh</th>{canManage && <th>Aksi</th>}</tr></thead><tbody>{periodTeacherAttendances.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{formatDate(item.attendanceDate)}</td><td><strong>{item.teacherName ?? teacherName(item.teacherId)}</strong></td><td>{item.session ? `${item.session.day}, ${item.session.time} - ${item.session.room}` : item.classSessionId}</td><td><span className={`operation-status ${item.status}`}>{item.status === 'present' ? 'Hadir' : item.status === 'excused' ? 'Izin' : 'Tidak hadir'}</span></td><td>{item.recordedBy ?? '-'}</td>{canManage && <td><button className="icon-danger" title="Hapus absensi" onClick={() => void run(() => onDeleteTeacherAttendance(item.id), 'Absensi dihapus')}><Trash2 size={16} /></button></td>}</tr>)}{!periodTeacherAttendances.length && <tr><td colSpan={canManage ? 7 : 6} className="empty-table">Belum ada absensi guru pada periode ini.</td></tr>}</tbody></table></div>
      </section>}

      {tab === 'student' && <section className="operation-panel">
        {canManage && <div className="operation-form absence-form"><label>Sesi kelas<select value={absenceForm.classSessionId} onChange={(event) => setAbsenceForm((form) => ({ ...form, classSessionId: event.target.value, studentId: '' }))}>{sessions.map((session) => <option key={session.id} value={session.id}>{sessionLabel(session)}</option>)}</select></label><label>Murid<select value={absenceForm.studentId} onChange={(event) => setAbsenceForm((form) => ({ ...form, studentId: event.target.value }))}><option value="">Pilih murid</option>{sessionStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label><label>Tanggal<input type="date" value={absenceForm.absenceDate} onChange={(event) => setAbsenceForm((form) => ({ ...form, absenceDate: event.target.value }))} /></label><label>Alasan<input value={absenceForm.reason} onChange={(event) => setAbsenceForm((form) => ({ ...form, reason: event.target.value }))} /></label><button className="btn-primary" disabled={saving || !absenceForm.studentId} onClick={saveAbsence}><Plus size={16} />Catat</button></div>}
        <div className="data-table-wrap"><table className="operation-table"><thead><tr><th>No.</th><th>Tanggal</th><th>Murid</th><th>Kelas asal</th><th>Alasan</th><th>Status</th>{canManage && <th>Aksi</th>}</tr></thead><tbody>{periodAbsences.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{formatDate(item.absenceDate)}</td><td><strong>{item.studentName ?? studentName(item.studentId)}</strong></td><td>{item.session ? `${item.session.day}, ${item.session.time} - ${item.session.teacherName ?? teacherName(item.session.teacherId)}` : item.classSessionId}</td><td>{item.reason || '-'}</td><td><span className={`operation-status ${item.status}`}>{item.status === 'open' ? 'Belum dijadwalkan' : item.status === 'replacement_scheduled' ? 'Pengganti tersedia' : 'Selesai'}</span></td>{canManage && <td className="row-actions">{item.status === 'open' && <button className="btn-secondary btn-sm" onClick={() => openMakeUpEditor(item)}>Atur Pengganti</button>}<button className="icon-danger" title="Hapus catatan" onClick={() => void run(() => onDeleteStudentAbsence(item.id), 'Catatan dihapus')}><Trash2 size={16} /></button></td>}</tr>)}{!periodAbsences.length && <tr><td colSpan={canManage ? 7 : 6} className="empty-table">Tidak ada murid yang dicatat tidak hadir pada periode ini.</td></tr>}</tbody></table></div>
      </section>}

      {tab === 'makeup' && <section className="operation-panel"><div className="data-table-wrap"><table className="operation-table"><thead><tr><th>No.</th><th>Tanggal</th><th>Murid</th><th>Guru yang sama</th><th>Jam & ruang</th><th>Status</th>{canManage && <th>Aksi</th>}</tr></thead><tbody>{periodMakeUps.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{formatDate(item.scheduledDate)}</td><td><strong>{item.studentName ?? studentName(item.studentId)}</strong></td><td>{item.teacherName ?? teacherName(item.teacherId)}</td><td>{item.time} - {item.room}</td><td><span className={`operation-status ${item.status}`}>{item.status === 'scheduled' ? 'Terjadwal' : item.status === 'completed' ? 'Selesai' : 'Dibatalkan'}</span></td>{canManage && <td className="row-actions">{item.status === 'scheduled' && <button className="btn-secondary btn-sm" onClick={() => void run(() => onSaveMakeUpSchedule({ ...item, status: 'completed' }, item.id), 'Jadwal diselesaikan')}>Selesaikan</button>}<button className="icon-danger" title="Batalkan jadwal" onClick={() => void run(() => onDeleteMakeUpSchedule(item.id), 'Jadwal dibatalkan')}><Trash2 size={16} /></button></td>}</tr>)}{!periodMakeUps.length && <tr><td colSpan={canManage ? 7 : 6} className="empty-table">Belum ada jadwal pengganti pada periode ini.</td></tr>}</tbody></table></div></section>}

      {makeUpModal && <div className="modal-overlay"><div className="modal-box operation-modal"><button className="modal-close-icon" onClick={() => setMakeUpModal(null)} aria-label="Tutup"><X size={18} /></button><span className="eyebrow">JADWAL PENGGANTI</span><h3>{makeUpModal.studentName ?? studentName(makeUpModal.studentId)}</h3><p>Guru tetap {makeUpModal.session?.teacherName ?? teacherName(makeUpModal.session?.teacherId)}. Hanya jam kosong guru yang dapat dipilih setelah disepakati dengan orang tua.</p><div className="modal-field-grid"><label>Tanggal<input type="date" min={makeUpModal.absenceDate} value={makeUpForm.scheduledDate} onChange={(event) => { const scheduledDate = event.target.value; const slots = availableTimes(makeUpModal, scheduledDate); setMakeUpForm((form) => ({ ...form, scheduledDate, time: slots[0] ?? '' })); }} /></label><label>Jam tersedia<select value={makeUpForm.time} onChange={(event) => setMakeUpForm((form) => ({ ...form, time: event.target.value }))}>{makeUpTimeOptions.length ? makeUpTimeOptions.map((time) => <option key={time} value={time}>{time} WIB</option>) : <option value="">Tidak ada slot kosong</option>}</select></label><label>Ruang<input value={makeUpForm.room} onChange={(event) => setMakeUpForm((form) => ({ ...form, room: event.target.value }))} /></label><label>Catatan<input value={makeUpForm.notes} onChange={(event) => setMakeUpForm((form) => ({ ...form, notes: event.target.value }))} /></label></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setMakeUpModal(null)}>Batal</button><button className="btn-primary" disabled={saving || !makeUpForm.time} onClick={saveMakeUp}>Simpan Jadwal</button></div></div></div>}
    </div>
  );
}
