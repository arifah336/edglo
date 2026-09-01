import { useState } from 'react';
import type { Payment, Program, Student } from '../../types';
import { BOOK_FEE, MONTH_NAMES, REGISTRATION_FEE, formatCurrency } from '../../data/mockData';

export type NewInvoice = Omit<Payment, 'id' | 'status' | 'paidDate'>;

type Props = {
  students: Student[];
  programs: Program[];
  initialMonth: number;
  initialYear: number;
  onClose: () => void;
  onCreate: (invoice: NewInvoice) => void;
};

function dueDateFor(student: Student | undefined, month: number, year: number) {
  const joinDay = student ? new Date(`${student.joinDate}T00:00:00`).getDate() : 1;
  const maxDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(joinDay, maxDay)).padStart(2, '0')}`;
}

export default function InvoiceModal({ students, programs, initialMonth, initialYear, onClose, onCreate }: Props) {
  const activeStudents = students.filter((student) => student.status === 'active');
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? '');
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [includeRegistration, setIncludeRegistration] = useState(false);
  const [includeBook, setIncludeBook] = useState(false);
  const [notes, setNotes] = useState('');
  const student = students.find((item) => item.id === studentId);
  const program = programs.find((item) => item.id === student?.programId);
  const registrationFee = includeRegistration ? REGISTRATION_FEE : 0;
  const bookFee = includeBook ? BOOK_FEE : 0;
  const total = (program?.price ?? 0) + registrationFee + bookFee;

  const submit = () => {
    if (!student || !program) return;
    onCreate({
      studentId: student.id,
      month,
      year,
      programFee: program.price,
      registrationFee,
      bookFee,
      total,
      dueDate: dueDateFor(student, month, year),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box invoice-modal">
        <div className="modal-title-row"><div><span className="eyebrow">TAGIHAN BARU</span><h2>Buat tagihan murid</h2><p>Biaya les mengikuti program murid secara otomatis.</p></div><button type="button" className="modal-x" onClick={onClose} aria-label="Tutup">×</button></div>
        <div className="invoice-form-grid">
          <div className="field-wide"><label className="input-label">Murid *</label><select className="input-field" value={studentId} onChange={(event) => setStudentId(event.target.value)}>{activeStudents.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></div>
          <div><label className="input-label">Bulan</label><select className="input-field" value={month} onChange={(event) => setMonth(Number(event.target.value))}>{MONTH_NAMES.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select></div>
          <div><label className="input-label">Tahun</label><select className="input-field" value={year} onChange={(event) => setYear(Number(event.target.value))}>{[2025, 2026, 2027].map((item) => <option value={item} key={item}>{item}</option>)}</select></div>
          <div className="field-wide invoice-program-preview"><span>Program</span><strong>{program?.name ?? '-'}</strong><b>{formatCurrency(program?.price ?? 0)} / bulan</b></div>
          <label className="fee-toggle"><input type="checkbox" checked={includeRegistration} onChange={(event) => setIncludeRegistration(event.target.checked)} /><span><strong>Biaya pendaftaran</strong><small>{formatCurrency(REGISTRATION_FEE)}</small></span></label>
          <label className="fee-toggle"><input type="checkbox" checked={includeBook} onChange={(event) => setIncludeBook(event.target.checked)} /><span><strong>Biaya buku</strong><small>{formatCurrency(BOOK_FEE)} / 2 bulan</small></span></label>
          <div className="field-wide"><label className="input-label">Catatan</label><textarea className="input-field" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan pembayaran (opsional)" /></div>
        </div>
        <div className="invoice-total"><div><span>Jatuh tempo</span><strong>{dueDateFor(student, month, year)}</strong></div><div><span>Total tagihan</span><strong>{formatCurrency(total)}</strong></div></div>
        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button type="button" className="btn-primary" onClick={submit}>Buat Tagihan</button></div>
      </div>
    </div>
  );
}
