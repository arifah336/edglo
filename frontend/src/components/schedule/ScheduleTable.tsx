import { useState } from 'react';
import type { ClassSession, Program, Student, Teacher } from '../../types';
import DataPagination from '../ui/DataPagination';

type Props = {
  sessions: ClassSession[];
  students: Student[];
  teachers: Teacher[];
  programs: Program[];
  onEdit: (session: ClassSession) => void;
  onDelete: (session: ClassSession) => void;
};

export default function ScheduleTable({ sessions, students, teachers, programs, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visibleSessions = sessions.slice(startIndex, startIndex + pageSize);

  return (
    <section className="schedule-list-section">
      <div className="schedule-list-head">
        <div><span className="eyebrow">DAFTAR KELAS</span><h3>Jadwal yang sudah dibuat</h3><p>Edit data kelas tanpa harus mencarinya di kalender mingguan.</p></div>
        <span>{sessions.length} kelas ditemukan</span>
      </div>
      <div className="schedule-table-shell">
        <table className="schedule-data-table">
          <thead><tr>{['No.', 'Hari & Jam', 'Program', 'Guru', 'Ruang', 'Murid', 'Kapasitas', 'Aksi'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
          <tbody>
            {visibleSessions.length === 0 && <tr><td colSpan={8} className="schedule-table-empty">Belum ada kelas yang sesuai dengan filter.</td></tr>}
            {visibleSessions.map((session, rowIndex) => {
              const teacher = teachers.find((item) => item.id === session.teacherId);
              const program = programs.find((item) => item.id === session.programId);
              const classStudents = session.studentIds.map((id) => students.find((student) => student.id === id)).filter((student): student is Student => Boolean(student));
              const fullness = Math.min((session.studentIds.length / Math.max(session.capacity, 1)) * 100, 100);
              const isFull = session.studentIds.length >= session.capacity;
              return (
                <tr key={session.id}>
                  <td className="schedule-number-cell"><span className="table-row-number">{startIndex + rowIndex + 1}</span></td>
                  <td data-label="Hari & Jam"><strong>{session.day}</strong><small>{session.time} WIB</small></td>
                  <td data-label="Program"><strong>{program?.name ?? '-'}</strong><small>ID {session.id}</small></td>
                  <td data-label="Guru"><strong>{teacher?.fullName ?? '-'}</strong><small>{teacher?.employmentType ?? '-'}</small></td>
                  <td data-label="Ruang"><strong>{session.room}</strong></td>
                  <td data-label="Murid"><strong>{classStudents.length} murid</strong><small>{classStudents.slice(0, 2).map((student) => student.fullName).join(', ') || 'Belum ada peserta'}</small></td>
                  <td data-label="Kapasitas"><div className="schedule-capacity-cell"><div><i style={{ width: `${fullness}%` }} /></div><span className={isFull ? 'full' : ''}>{session.studentIds.length}/{session.capacity}</span></div></td>
                  <td className="schedule-table-actions"><div><button type="button" className="btn-secondary btn-sm" onClick={() => onEdit(session)}>Edit</button><button type="button" className="btn-danger btn-sm" onClick={() => onDelete(session)}>Hapus</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DataPagination totalItems={sessions.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="kelas" />
    </section>
  );
}
