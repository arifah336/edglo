import type { Payment, Student } from '../../types';
import { MONTH_NAMES, formatCurrency, formatDate, getProgramById } from '../../data/mockData';
import { invoiceNumber } from './PaymentTable';

type Props = { payment: Payment; students: Student[]; onClose: () => void; onPrint: () => void; onMarkPaid: () => void };

export default function InvoiceDetailModal({ payment, students, onClose, onPrint, onMarkPaid }: Props) {
  const student = students.find((item) => item.id === payment.studentId);
  const program = student ? getProgramById(student.programId) : undefined;
  return (
    <div className="modal-overlay">
      <div className="modal-box invoice-detail-modal">
        <div className="modal-title-row"><div><span className="eyebrow">RINCIAN TAGIHAN</span><h2>{invoiceNumber(payment)}</h2><p>{MONTH_NAMES[payment.month - 1]} {payment.year}</p></div><button type="button" className="modal-x" onClick={onClose} aria-label="Tutup">×</button></div>
        <div className="invoice-party"><div><span>Ditagihkan kepada</span><strong>{student?.fullName ?? '-'}</strong><small>{student?.parentName ?? '-'}</small></div><span className={`badge badge-${payment.status}`}>{payment.status === 'paid' ? 'Lunas' : payment.status === 'overdue' ? 'Terlambat' : 'Menunggu'}</span></div>
        <div className="invoice-lines"><div><span>Biaya {program?.name ?? 'program'}</span><strong>{formatCurrency(payment.programFee)}</strong></div>{payment.registrationFee > 0 && <div><span>Biaya pendaftaran</span><strong>{formatCurrency(payment.registrationFee)}</strong></div>}{payment.bookFee > 0 && <div><span>Biaya buku</span><strong>{formatCurrency(payment.bookFee)}</strong></div>}<div className="invoice-grand-total"><span>Total</span><strong>{formatCurrency(payment.total)}</strong></div></div>
        <div className="invoice-dates"><div><span>Jatuh tempo</span><strong>{formatDate(payment.dueDate)}</strong></div><div><span>Tanggal dibayar</span><strong>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</strong></div></div>
        {payment.notes && <p className="invoice-notes">{payment.notes}</p>}
        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={onPrint}>Cetak</button>{payment.status !== 'paid' && <button type="button" className="btn-primary" onClick={onMarkPaid}>Tandai Lunas</button>}</div>
      </div>
    </div>
  );
}
