import type { Page, Student } from '../../types';
import { TEACHERS, formatCurrency, formatDate, getProgramById } from '../../data/mockData';

type Props = { students: Student[]; onNavigate: (page: Page, id?: string) => void; startIndex?: number };

export default function StudentTable({ students, onNavigate, startIndex = 0 }: Props) {
  return (
    <div className="card student-table-shell" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="student-data-table">
        <thead><tr>{['Nama Murid', 'Orang Tua & Kontak', 'Program', 'Guru', 'Jadwal', 'Tgl Masuk', 'Status', 'Aksi'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>
          {students.length === 0 && <tr><td colSpan={8} className="student-table-empty">Tidak ada data murid yang sesuai.</td></tr>}
          {students.map((student, rowIndex) => {
            const program = getProgramById(student.programId);
            const teacher = TEACHERS.find((item) => item.id === student.teacherId);
            return (
              <tr key={student.id} className="table-row">
                <td data-label="Nama Murid"><div className="student-name-cell"><span className="table-row-number">{startIndex + rowIndex + 1}</span><span className="student-list-avatar">{student.fullName.charAt(0)}</span><div className="student-name-copy"><strong>{student.fullName}</strong><small>ID {student.id}</small></div></div></td>
                <td data-label="Orang Tua & Kontak"><strong>{student.parentName}</strong><small>{student.phone}</small></td>
                <td data-label="Program"><strong>{program?.name ?? '-'}</strong><small>{formatCurrency(program?.price ?? 0)}/bulan</small></td>
                <td data-label="Guru"><strong>{teacher?.fullName ?? '-'}</strong><small>{teacher?.employmentType ?? 'Belum ditentukan'}</small></td>
                <td data-label="Jadwal"><div className="student-schedule-list">{student.schedules.length ? student.schedules.map((schedule, index) => <span className="student-schedule-chip" key={`${schedule.day}-${schedule.time}-${index}`}>{schedule.day.slice(0, 3)} {schedule.time}</span>) : <small>Belum ada jadwal</small>}</div></td>
                <td data-label="Tanggal Masuk"><strong>{formatDate(student.joinDate)}</strong><small>{student.leaveDate ? `Off ${formatDate(student.leaveDate)}` : 'Masih bergabung'}</small></td>
                <td data-label="Status"><span className={`badge badge-${student.status}`}>{student.status === 'active' ? 'Aktif' : 'Off'}</span></td>
                <td data-label="Aksi"><div className="student-action-cell"><button className="btn-secondary btn-sm" onClick={() => onNavigate('student-detail', student.id)}>Detail</button><button className="btn-secondary btn-sm" onClick={() => onNavigate('student-form', student.id)}>Edit</button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
