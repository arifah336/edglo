import { ArrowRight, CalendarDays, GraduationCap, Medal } from 'lucide-react';
import type { TeacherPortalStudent } from '../../../types';

type Props = { students: TeacherPortalStudent[]; onRecordProgress: (studentId: string) => void };

export default function TeacherStudents({ students, onRecordProgress }: Props) {
  return <section className="teacher-students-page">
    <div className="teacher-students-intro"><div><span className="eyebrow">MURID TANGGUNGAN</span><h2>{students.length} murid aktif</h2><p>Pantau jadwal dan perkembangan setiap anak yang ditugaskan kepada Anda.</p></div></div>
    <div className="teacher-student-cards">{students.map((student) => <article key={student.id}>
      <div className="teacher-student-card-head"><span style={student.photo ? { backgroundImage: `url(${student.photo})` } : undefined}>{student.photo ? '' : student.fullName.charAt(0)}</span><div><small>{student.id}</small><strong>{student.fullName}</strong><p>{student.programName}{student.currentLevel ? ` · Level ${student.currentLevel}` : ''}</p></div></div>
      <div className="teacher-student-card-stats"><span><Medal size={16} /><strong>{student.totalPoints}</strong><small>Total poin</small></span><span><CalendarDays size={16} /><strong>{student.schedules.length}x</strong><small>Per minggu</small></span><span><GraduationCap size={16} /><strong>{student.progressLogs.length}</strong><small>Aktivitas</small></span></div>
      <div className="teacher-student-card-schedule">{student.schedules.map((schedule) => <span key={`${schedule.day}-${schedule.time}`}><b>{schedule.day.slice(0, 3)}</b>{schedule.time}</span>)}</div>
      <button type="button" onClick={() => onRecordProgress(student.id)}>Catat perkembangan <ArrowRight size={15} /></button>
    </article>)}</div>
    {!students.length && <div className="teacher-portal-empty">Belum ada murid aktif yang ditugaskan kepada akun guru ini.</div>}
  </section>;
}
