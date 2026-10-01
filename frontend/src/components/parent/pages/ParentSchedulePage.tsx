import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import type { ParentSession, Student } from '../../../types';

export default function ParentSchedulePage({ sessions, students }: { sessions: ParentSession[]; students: Student[] }) {
  const studentName = (ids: string[]) => students.filter((student) => ids.includes(student.id)).map((student) => student.fullName).join(', ');
  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Kalender Akademik</p><h2>Jadwal belajar mingguan</h2><span>Jadwal ini tetap berlaku sampai perubahan disetujui Admin.</span></div></section>
      {sessions.length ? <section className="parent-schedule-page-list">{sessions.map((item) => <article key={item.id}>
        <div className="parent-schedule-day"><strong>{item.day}</strong><span>{item.time} WIB</span></div>
        <div className="parent-schedule-main"><h3>{item.programName}</h3><p><UserRound size={14} />{studentName(item.studentIds) || 'Murid EdGLO'}</p></div>
        <div className="parent-schedule-meta"><span><UserRound size={14} />{item.teacherName}</span><span><MapPin size={14} />{item.room}</span></div>
        <span className={`parent-session-source ${item.isClassSession === false ? 'manual' : ''}`}>{item.isClassSession === false ? 'Jadwal murid' : 'Kelas aktif'}</span>
      </article>)}</section> : <section className="parent-empty-page"><CalendarDays size={36} /><h3>Jadwal belum tersedia</h3><p>Admin akan menetapkan kelas setelah data anak selesai diproses.</p></section>}
      <section className="parent-info-strip"><Clock3 size={19} /><div><strong>Perlu penyesuaian belajar?</strong><span>Gunakan menu Ubah Jadwal untuk memindahkan sesi atau Tambah Jadwal bila kuota paket masih tersedia.</span></div></section>
    </div>
  );
}
