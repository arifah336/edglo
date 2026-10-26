import { ArrowRight, BookOpenCheck, CalendarCheck2, CalendarDays, GraduationCap, MapPin, Medal, UsersRound } from 'lucide-react';
import type { StudentProgressLog, TeacherOverview, TeacherPortalClass } from '../../../types';
import type { TeacherPortalView } from './TeacherSidebar';
import { formatDate } from '../../../data/mockData';

type RecentActivity = StudentProgressLog & { studentName: string };

type Props = {
  overview: TeacherOverview;
  todayClasses: TeacherPortalClass[];
  upcomingClasses: TeacherPortalClass[];
  recentActivities: RecentActivity[];
  todayActivityCount: number;
  onNavigate: (view: TeacherPortalView) => void;
  onRecordProgress: (studentId?: string) => void;
};

const ACTIVITY_LABELS: Record<StudentProgressLog['activityType'], string> = {
  reading: 'Membaca', practice: 'Latihan', homework: 'Tugas', achievement: 'Pencapaian',
};

export default function TeacherDashboard({ overview, todayClasses, upcomingClasses, recentActivities, todayActivityCount, onNavigate, onRecordProgress }: Props) {
  const firstName = overview.teacher.fullName.split(' ')[0];
  const weeklyClasses = overview.classes?.length || overview.summary.weeklySessions;

  return <>
    <section className="teacher-welcome-band">
      <div><span className="eyebrow">RINGKASAN HARI INI</span><h2>Selamat datang, {firstName}</h2><p>{todayClasses.length ? `Ada ${todayClasses.length} kelas yang perlu Anda dampingi hari ini.` : 'Tidak ada kelas hari ini. Gunakan waktu untuk meninjau perkembangan murid.'}</p></div>
      <button type="button" className="btn-primary" onClick={() => onRecordProgress()}><BookOpenCheck size={17} />Catat perkembangan</button>
    </section>

    <div className="teacher-portal-summary four-columns">
      <article><CalendarCheck2 size={20} /><span>Kelas hari ini<small>Agenda mengajar</small></span><strong>{todayClasses.length}</strong></article>
      <article><UsersRound size={20} /><span>Murid aktif<small>Tanggung jawab Anda</small></span><strong>{overview.summary.activeStudents}</strong></article>
      <article><CalendarDays size={20} /><span>Kelas per minggu<small>Jadwal aktif</small></span><strong>{weeklyClasses}</strong></article>
      <article><Medal size={20} /><span>Poin bulan ini<small>{todayActivityCount} catatan hari ini</small></span><strong>{overview.summary.pointsThisMonth}</strong></article>
    </div>

    <div className="teacher-dashboard-layout">
      <section className="teacher-dashboard-section teacher-today-section">
        <div className="teacher-section-heading"><div><span className="eyebrow">AGENDA</span><h3>Kelas hari ini</h3></div><button type="button" onClick={() => onNavigate('schedule')}>Lihat jadwal <ArrowRight size={15} /></button></div>
        <div className="teacher-agenda-list">
          {todayClasses.map((item) => <article key={item.id}>
            <time>{item.time}<small>WIB</small></time>
            <div><strong>{item.programName}</strong><span><MapPin size={13} />{item.room}<i /> <UsersRound size={13} />{item.students.length} murid</span></div>
            <div className="teacher-avatar-stack">{item.students.slice(0, 3).map((student) => <span key={student.id} title={student.fullName} style={student.photo ? { backgroundImage: `url(${student.photo})` } : undefined}>{student.photo ? '' : student.fullName.charAt(0)}</span>)}</div>
          </article>)}
          {!todayClasses.length && <div className="teacher-agenda-empty"><CalendarCheck2 size={26} /><div><strong>Tidak ada kelas hari ini</strong><span>Agenda terdekat sudah disiapkan di sebelah kanan.</span></div></div>}
        </div>
      </section>

      <section className="teacher-dashboard-section teacher-upcoming-section">
        <div className="teacher-section-heading"><div><span className="eyebrow">BERIKUTNYA</span><h3>Jadwal terdekat</h3></div></div>
        <div className="teacher-upcoming-list">
          {upcomingClasses.map((item) => <article key={item.id}><div className="teacher-day-badge"><strong>{item.day.slice(0, 3)}</strong><small>{item.time}</small></div><div><strong>{item.programName}</strong><span>{item.room} · {item.students.length} murid</span></div></article>)}
          {!upcomingClasses.length && <div className="teacher-portal-empty compact">Belum ada jadwal kelas aktif.</div>}
        </div>
      </section>

      <section className="teacher-dashboard-section teacher-recent-section">
        <div className="teacher-section-heading"><div><span className="eyebrow">AKTIVITAS</span><h3>Perkembangan terbaru</h3></div><button type="button" onClick={() => onNavigate('progress')}>Buka progres <ArrowRight size={15} /></button></div>
        <div className="teacher-recent-list">
          {recentActivities.slice(0, 5).map((activity) => <article key={activity.id}><span className={activity.activityType}><GraduationCap size={17} /></span><div><strong>{activity.studentName}</strong><small>{ACTIVITY_LABELS[activity.activityType]} · {activity.notes || 'Tanpa catatan'}</small></div><time>{formatDate(activity.activityDate)}</time><b>+{activity.points}</b></article>)}
          {!recentActivities.length && <div className="teacher-portal-empty compact">Belum ada perkembangan murid yang dicatat.</div>}
        </div>
      </section>

      <section className="teacher-dashboard-section teacher-class-overview">
        <div className="teacher-section-heading"><div><span className="eyebrow">KELAS SAYA</span><h3>Komposisi program</h3></div><button type="button" onClick={() => onNavigate('students')}>Lihat murid <ArrowRight size={15} /></button></div>
        <div className="teacher-program-list">{Array.from(new Set(overview.students.map((student) => student.programName))).map((program) => {
          const members = overview.students.filter((student) => student.programName === program);
          return <article key={program}><span><GraduationCap size={17} /></span><div><strong>{program}</strong><small>{members.map((student) => student.fullName).join(', ')}</small></div><b>{members.length}</b></article>;
        })}</div>
      </section>
    </div>
  </>;
}
