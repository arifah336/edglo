import { BookOpen, CalendarDays, Plus, Trash2 } from 'lucide-react';
import type { StudentProgressLog, TeacherPortalStudent } from '../../../types';
import { formatDate } from '../../../data/mockData';

const ACTIVITY_LABELS: Record<StudentProgressLog['activityType'], string> = {
  reading: 'Membaca', practice: 'Latihan', homework: 'Tugas', achievement: 'Pencapaian',
};

type ProgressForm = { activityDate: string; activityType: StudentProgressLog['activityType']; points: number; notes: string };

type Props = {
  students: TeacherPortalStudent[];
  selectedId: string;
  onSelect: (id: string) => void;
  form: ProgressForm;
  onFormChange: (form: ProgressForm) => void;
  saving: boolean;
  onSave: () => void;
  onDelete: (id: string) => void;
};

export default function TeacherProgress({ students, selectedId, onSelect, form, onFormChange, saving, onSave, onDelete }: Props) {
  const selectedStudent = students.find((student) => student.id === selectedId);

  return <div className="teacher-progress-page">
    <aside className="teacher-student-selector"><div><span className="eyebrow">PILIH MURID</span><h3>Anak tanggungan</h3></div>{students.map((student) => <button type="button" className={student.id === selectedId ? 'active' : ''} key={student.id} onClick={() => onSelect(student.id)}><span style={student.photo ? { backgroundImage: `url(${student.photo})` } : undefined}>{student.photo ? '' : student.fullName.charAt(0)}</span><div><strong>{student.fullName}</strong><small>{student.programName}</small></div><b>{student.totalPoints}</b></button>)}</aside>

    {!selectedStudent ? <div className="teacher-portal-empty">Belum ada murid aktif yang dapat dicatat.</div> : <section className="teacher-student-overview">
      <div className="teacher-student-head"><span style={selectedStudent.photo ? { backgroundImage: `url(${selectedStudent.photo})` } : undefined}>{selectedStudent.photo ? '' : selectedStudent.fullName.charAt(0)}</span><div><small>{selectedStudent.id}</small><h2>{selectedStudent.fullName}</h2><p>{selectedStudent.programName}{selectedStudent.currentLevel ? ` · Level ${selectedStudent.currentLevel}` : ''}</p></div><strong>{selectedStudent.totalPoints}<small>Total poin</small></strong></div>
      <div className="teacher-student-schedules">{selectedStudent.schedules.map((schedule) => <div key={`${schedule.day}-${schedule.time}`}><CalendarDays size={16} /><span>{schedule.day}</span><strong>{schedule.time} WIB</strong></div>)}</div>
      <div className="teacher-progress-heading"><div><span className="eyebrow">AKTIVITAS TERBARU</span><h3>Riwayat perkembangan</h3></div></div>
      <div className="teacher-progress-list">{selectedStudent.progressLogs.map((log) => <article key={log.id}><span className={log.activityType}><BookOpen size={17} /></span><div><strong>{ACTIVITY_LABELS[log.activityType]}</strong><small>{log.notes || 'Tidak ada catatan tambahan.'}</small></div><time>{formatDate(log.activityDate)}</time><b>+{log.points}</b><button type="button" onClick={() => onDelete(log.id)} aria-label="Hapus catatan" title="Hapus catatan"><Trash2 size={15} /></button></article>)}{!selectedStudent.progressLogs.length && <div className="teacher-portal-empty compact">Belum ada aktivitas yang dicatat.</div>}</div>
    </section>}

    <aside className="teacher-progress-form"><span className="eyebrow">CATAT PROGRES</span><h2>Tambah aktivitas</h2><p>Poin dipakai untuk melihat konsistensi belajar dan bukan nilai akademik.</p><label>Tanggal<input type="date" value={form.activityDate} onChange={(event) => onFormChange({ ...form, activityDate: event.target.value })} /></label><label>Jenis aktivitas<select value={form.activityType} onChange={(event) => onFormChange({ ...form, activityType: event.target.value as StudentProgressLog['activityType'] })}>{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Poin<input type="number" min="0" max="100" value={form.points} onChange={(event) => onFormChange({ ...form, points: Number(event.target.value) })} /></label><label>Catatan<textarea rows={5} value={form.notes} onChange={(event) => onFormChange({ ...form, notes: event.target.value })} placeholder="Contoh: membaca satu cerita tanpa bantuan" /></label><button type="button" className="btn-primary" disabled={saving || !selectedStudent} onClick={onSave}><Plus size={17} />{saving ? 'Menyimpan...' : 'Simpan Aktivitas'}</button></aside>
  </div>;
}
