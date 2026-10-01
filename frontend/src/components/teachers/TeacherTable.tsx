import type { ClassSession, EmploymentType, Teacher } from '../../types';
import { formatDate } from '../../data/mockData';

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = { fulltime: 'Fulltime', parttime: 'Part Time', magang: 'Magang' };
type Props = { teachers: Teacher[]; sessions: ClassSession[]; onView: (id: string) => void; onEdit: (id: string) => void; startIndex?: number; canManage?: boolean };

export default function TeacherTable({ teachers, sessions, onView, onEdit, startIndex = 0, canManage = true }: Props) {
  return (
    <div className="teacher-table-card">
      <table className="teacher-data-table">
        <thead><tr>{['Guru', 'Kontak', 'Pendidikan', 'Tipe Kerja', 'Beban Mengajar', 'Tgl Masuk', 'Status', 'Aksi'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>
          {teachers.length === 0 && <tr><td colSpan={8} className="teacher-table-empty">Tidak ada data guru</td></tr>}
          {teachers.map((teacher, rowIndex) => {
            const teacherSessions = sessions.filter((session) => session.teacherId === teacher.id);
            const studentCount = new Set(teacherSessions.flatMap((session) => session.studentIds)).size;
            return <tr key={teacher.id} className="table-row"><td><div className="teacher-name-cell"><span className="table-row-number">{startIndex + rowIndex + 1}</span><span className="teacher-avatar">{teacher.fullName.charAt(0)}</span><div><strong>{teacher.fullName}</strong><small>ID {teacher.id}</small></div></div></td><td data-label="Kontak"><strong>{teacher.phone}</strong><small>{teacher.email}</small></td><td data-label="Pendidikan"><strong>{teacher.lastEducation}</strong></td><td data-label="Tipe Kerja"><span className={`badge badge-${teacher.employmentType}`}>{EMPLOYMENT_LABELS[teacher.employmentType]}</span></td><td data-label="Beban Mengajar"><div className="teacher-table-load"><strong>{teacherSessions.length} sesi</strong><small>{studentCount} murid aktif</small></div></td><td data-label="Tanggal Masuk"><strong>{formatDate(teacher.joinDate)}</strong></td><td className="teacher-status-cell"><span className={`badge badge-${teacher.status}`}>{teacher.status === 'active' ? 'Aktif' : 'Off'}</span></td><td className="teacher-action-cell"><div><button className="btn-secondary btn-sm" onClick={() => onView(teacher.id)}>Detail</button>{canManage && <button className="btn-secondary btn-sm" onClick={() => onEdit(teacher.id)}>Edit</button>}</div></td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
