import type { Program, Student } from '../../types';
import { formatCurrency } from '../../data/mockData';

export default function ProgramSummaryTable({ students, programs }: { students: Student[]; programs: Program[] }) {
  const activeStudents = students.filter((student) => student.status === 'active');
  return (
    <div className="data-table-shell report-program-table">
      <table className="data-table">
        <thead><tr><th>Program</th><th>Harga / Bulan</th><th>Murid Aktif</th><th>Sesi / Minggu</th><th>Potensi Pemasukan</th></tr></thead>
        <tbody>{programs.map((program, rowIndex) => {
          const count = activeStudents.filter((student) => student.programId === program.id).length;
          return <tr key={program.id}><td><div className="numbered-program"><span className="table-row-number">{rowIndex + 1}</span><div><strong>{program.name}</strong><small>{program.sessionsPerWeek} pertemuan per minggu</small></div></div></td><td>{formatCurrency(program.price)}</td><td><strong>{count} murid</strong></td><td>{count * program.sessionsPerWeek} sesi</td><td className="money-cell">{formatCurrency(count * program.price)}</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}
