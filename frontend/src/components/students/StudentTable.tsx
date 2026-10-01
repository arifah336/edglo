import type { Page, Program, Student, Teacher } from '../../types';
import { PROGRAMS, TEACHERS, formatCurrency, formatDate } from '../../data/mockData';

type Props = { students: Student[]; teachers?: Teacher[]; programs?: Program[]; onNavigate: (page: Page, id?: string) => void; startIndex?: number; canManage?: boolean };

export default function StudentTable({ students, teachers = TEACHERS, programs = PROGRAMS, onNavigate, startIndex = 0, canManage = true }: Props) {
  return (
    <div className="card student-table-shell" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="student-data-table">
        <thead><tr>{['Nama Murid', 'Orang Tua & Kontak', 'Program', 'Guru', 'Jadwal', 'Masuk & Paket', 'Status', 'Aksi'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>
          {students.length === 0 && <tr><td colSpan={8} className="student-table-empty">Tidak ada data murid yang sesuai.</td></tr>}
          {students.map((student, rowIndex) => {
            const program = programs.find((item) => item.id === student.programId);
            const teacher = teachers.find((item) => item.id === student.teacherId);
            return (
              <tr key={student.id} className="table-row">
                <td data-label="Nama Murid"><div className="student-name-cell"><span className="table-row-number">{startIndex + rowIndex + 1}</span><span className={`student-list-avatar ${student.photo ? 'has-photo' : ''}`} style={student.photo ? { backgroundImage: `url(${student.photo})` } : undefined}>{student.photo ? '' : student.fullName.charAt(0)}</span><div className="student-name-copy"><strong>{student.fullName}</strong><small>ID {student.id}</small></div></div></td>
                <td data-label="Orang Tua & Kontak"><strong>{student.parentName}</strong><small>{student.phone}</small></td>
                <td data-label="Program"><strong>{program?.name ?? '-'}</strong><small>{formatCurrency(program?.price ?? 0)}/bulan</small></td>
                <td data-label="Guru"><strong>{teacher?.fullName ?? '-'}</strong><small>{teacher?.employmentType ?? 'Belum ditentukan'}</small></td>
                <td data-label="Jadwal"><div className="student-schedule-list">{student.schedules.length ? student.schedules.map((schedule, index) => <span className="student-schedule-chip" key={`${schedule.day}-${schedule.time}-${index}`}>{schedule.day.slice(0, 3)} {schedule.time}</span>) : <small>Belum ada jadwal</small>}</div></td>
                <td data-label="Masuk & Paket"><strong>{formatDate(student.joinDate)}</strong><small>{student.leaveDate ? `Off ${formatDate(student.leaveDate)}` : student.packageEndsAt ? `Paket s.d. ${formatDate(student.packageEndsAt)}` : 'Masa paket belum diatur'}</small></td>
                <td data-label="Status"><span className={`badge badge-${student.status}`}>{student.status === 'active' ? 'Aktif' : 'Off'}</span></td>
                <td data-label="Aksi"><div className="student-action-cell"><button className="btn-secondary btn-sm" onClick={() => onNavigate('student-detail', student.id)}>Detail</button>{canManage && <button className="btn-secondary btn-sm" onClick={() => onNavigate('student-form', student.id)}>Edit</button>}</div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
