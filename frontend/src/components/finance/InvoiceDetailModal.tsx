import type { Payment, Program, Student } from '../../types';
import { MONTH_NAMES, TODAY, formatCurrency, formatDate } from '../../data/mockData';
import { getPaymentDueState } from '../../lib/paymentDue';
import { invoiceNumber } from './PaymentTable';

type Props = { payment: Payment; students: Student[]; programs: Program[]; onClose: () => void; onPrint: () => void; onMarkPaid: () => void; canManage?: boolean };

export default function InvoiceDetailModal({ payment, students, programs, onClose, onPrint, onMarkPaid, canManage = true }: Props) {
  const student = students.find((item) => item.id === payment.studentId);
  const program = student ? programs.find((item) => item.id === student.programId) : undefined;
  const dueState = getPaymentDueState(payment, TODAY);

  return (
    <div className="modal-overlay">
      <div className="modal-box invoice-detail-modal">
        <div className="modal-title-row">
          <div><span className="eyebrow">RINCIAN TAGIHAN</span><h2>{invoiceNumber(payment)}</h2><p>{MONTH_NAMES[payment.month - 1]} {payment.year}</p></div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Tutup">x</button>
        </div>
        <div className="invoice-party">
          <div><span>Ditagihkan kepada</span><strong>{student?.fullName ?? '-'}</strong><small>{student?.parentName ?? '-'}</small></div>
          <div className="payment-status-stack">
            <span className={`badge badge-${dueState.status} due-badge-${dueState.tone}`}>{dueState.badgeLabel}</span>
            <small className={`payment-due-note due-${dueState.tone}`}>{dueState.timingLabel}</small>
          </div>
        </div>
        <div className="invoice-lines">
          <div><span>Biaya {program?.name ?? 'program'}</span><strong>{formatCurrency(payment.programFee)}</strong></div>
          {payment.registrationFee > 0 && <div><span>Biaya pendaftaran</span><strong>{formatCurrency(payment.registrationFee)}</strong></div>}
          {payment.bookFee > 0 && <div><span>Biaya buku</span><strong>{formatCurrency(payment.bookFee)}</strong></div>}
          {(payment.otherFee ?? 0) > 0 && <div><span>Biaya lainnya</span><strong>{formatCurrency(payment.otherFee ?? 0)}</strong></div>}
          {(payment.discount ?? 0) > 0 && <div className="invoice-discount-line"><span>Diskon / promo</span><strong>-{formatCurrency(payment.discount ?? 0)}</strong></div>}
          <div className="invoice-grand-total"><span>Total</span><strong>{formatCurrency(payment.total)}</strong></div>
        </div>
        <div className="invoice-dates">
          <div><span>Jatuh tempo</span><strong>{formatDate(payment.dueDate)}</strong></div>
          <div><span>Tanggal dibayar</span><strong>{payment.paidDate ? formatDate(payment.paidDate) : '-'}</strong></div>
        </div>
        {payment.notes && <p className="invoice-notes">{payment.notes}</p>}
        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={onPrint}>Cetak</button>{canManage && payment.status !== 'paid' && <button type="button" className="btn-primary" onClick={onMarkPaid}>Tandai Lunas</button>}</div>
      </div>
    </div>
  );
}
