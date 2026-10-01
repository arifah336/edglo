import { BookOpen, CalendarDays, UserRound } from 'lucide-react';
import type { Student } from '../../../types';

export default function ParentChildrenPage({ students }: { students: Student[] }) {
  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Data Akademik</p><h2>Anak & program belajar</h2><span>Informasi program, level, pengajar, dan jadwal setiap anak.</span></div></section>
      {students.length ? <section className="parent-child-grid">{students.map((student) => <article key={student.id}>
        <header><span>{student.fullName.charAt(0)}</span><div><h3>{student.fullName}</h3><p>ID {student.id}</p></div><small className={student.status}>{student.status === 'active' ? 'Aktif' : 'Off'}</small></header>
        <div className="parent-child-program"><BookOpen size={19} /><div><small>Program</small><strong>{student.program?.name ?? 'Program EdGLO'}</strong>{student.currentLevel && <p>Level {student.currentLevel}</p>}</div></div>
        <dl><div><dt>Pengajar</dt><dd>{student.teacher?.fullName ?? 'Belum ditentukan'}</dd></div><div><dt>Pertemuan</dt><dd>{student.sessionsPerWeek} sesi / minggu</dd></div><div><dt>Tanggal masuk</dt><dd>{new Date(student.joinDate).toLocaleDateString('id-ID')}</dd></div></dl>
        <div className="parent-child-schedules"><span><CalendarDays size={15} />Jadwal aktif</span><div>{student.schedules.length ? student.schedules.map((schedule) => <small key={`${schedule.day}-${schedule.time}`}>{schedule.day}, {schedule.time}</small>) : <p>Belum ada jadwal.</p>}</div></div>
      </article>)}</section> : <section className="parent-empty-page"><UserRound size={36} /><h3>Belum ada murid aktif</h3><p>Data anak muncul setelah pendaftaran disetujui Admin.</p></section>}
    </div>
  );
}
