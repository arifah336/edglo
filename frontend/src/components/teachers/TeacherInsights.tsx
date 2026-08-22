import type { ClassSession, EmploymentType, Student, Teacher } from '../../types';

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  fulltime: 'Fulltime',
  parttime: 'Part Time',
  magang: 'Magang',
};

type Props = {
  teachers: Teacher[];
  students: Student[];
  sessions: ClassSession[];
};

export default function TeacherInsights({ teachers, students, sessions }: Props) {
  const activeTeachers = teachers.filter((teacher) => teacher.status === 'active');
  const activeStudents = students.filter((student) => student.status === 'active');
  const assignedStudentIds = new Set(sessions.flatMap((session) => session.studentIds));
  const employment = (['fulltime', 'parttime', 'magang'] as EmploymentType[]).map((type) => ({
    type,
    label: EMPLOYMENT_LABELS[type],
    count: activeTeachers.filter((teacher) => teacher.employmentType === type).length,
  }));
  const activeTotal = Math.max(activeTeachers.length, 1);
  const fulltimePercent = (employment[0].count / activeTotal) * 100;
  const parttimePercent = (employment[1].count / activeTotal) * 100;
  const workload = activeTeachers
    .map((teacher) => {
      const teacherSessions = sessions.filter((session) => session.teacherId === teacher.id);
      const studentIds = new Set(teacherSessions.flatMap((session) => session.studentIds));
      return { teacher, sessions: teacherSessions.length, students: studentIds.size };
    })
    .sort((a, b) => b.sessions - a.sessions || b.students - a.students);
  const maxSessions = Math.max(...workload.map((item) => item.sessions), 1);
  const averageSessions = activeTeachers.length ? Math.round((sessions.length / activeTeachers.length) * 10) / 10 : 0;

  return (
    <section className="teacher-insights" aria-label="Statistik guru">
      <div className="teacher-stat-grid">
        <article className="teacher-stat-card tone-teal">
          <span>Guru terdaftar</span><strong>{teachers.length}</strong><small>Seluruh riwayat tenaga pengajar</small>
        </article>
        <article className="teacher-stat-card tone-green">
          <span>Guru aktif</span><strong>{activeTeachers.length}</strong><small>{Math.round((activeTeachers.length / Math.max(teachers.length, 1)) * 100)}% dari total guru</small>
        </article>
        <article className="teacher-stat-card tone-blue">
          <span>Murid terlayani</span><strong>{assignedStudentIds.size}</strong><small>dari {activeStudents.length} murid aktif</small>
        </article>
        <article className="teacher-stat-card tone-yellow">
          <span>Sesi per minggu</span><strong>{sessions.length}</strong><small>Rata-rata {averageSessions} sesi per guru</small>
        </article>
      </div>

      <div className="teacher-analytics-grid">
        <article className="teacher-analytics-panel employment-panel">
          <header><div><span className="eyebrow">KOMPOSISI TIM</span><h3>Status kerja guru aktif</h3></div><strong>{activeTeachers.length} guru</strong></header>
          <div className="employment-content">
            <div className="employment-donut" style={{ background: `conic-gradient(#1687A7 0 ${fulltimePercent}%, #397FC4 ${fulltimePercent}% ${fulltimePercent + parttimePercent}%, #D6A322 ${fulltimePercent + parttimePercent}% 100%)` }}>
              <div><strong>{activeTeachers.length}</strong><span>Aktif</span></div>
            </div>
            <div className="employment-legend">
              {employment.map((item) => <div key={item.type}><i className={`employment-${item.type}`} /><span>{item.label}</span><strong>{item.count}</strong><small>{Math.round((item.count / activeTotal) * 100)}%</small></div>)}
            </div>
          </div>
        </article>

        <article className="teacher-analytics-panel workload-panel">
          <header><div><span className="eyebrow">BEBAN MENGAJAR</span><h3>Sesi aktif per guru</h3></div><small>Data jadwal minggu berjalan</small></header>
          <div className="teacher-load-list">
            {workload.slice(0, 6).map((item, index) => (
              <div className="teacher-load-row" key={item.teacher.id}>
                <span className="teacher-rank">{index + 1}</span>
                <div className="teacher-load-name"><strong>{item.teacher.fullName}</strong><small>{item.students} murid</small></div>
                <div className="teacher-load-track"><i style={{ width: `${Math.max((item.sessions / maxSessions) * 100, item.sessions ? 8 : 0)}%` }} /></div>
                <strong className="teacher-load-value">{item.sessions}<small>sesi</small></strong>
              </div>
            ))}
            {workload.length === 0 && <div className="teacher-insight-empty">Belum ada guru aktif.</div>}
          </div>
        </article>
      </div>
    </section>
  );
}
