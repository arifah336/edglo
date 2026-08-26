import type { Payment, Student } from '../../types';
import { MONTH_NAMES, TODAY, formatCurrency, formatDate, getProgramById } from '../../data/mockData';
import { getPaymentDueState } from '../../lib/paymentDue';

type Props = {
  payments: Payment[];
  students: Student[];
  mode: 'monthly' | 'yearly';
  onView: (payment: Payment) => void;
  onMarkPaid: (payment: Payment) => void;
  startIndex?: number;
};

export function invoiceNumber(payment: Payment) {
  return `INV/${payment.year}/${String(payment.month).padStart(2, '0')}/${payment.id.replace(/\D/g, '').padStart(4, '0')}`;
}

export default function PaymentTable({ payments, students, mode, onView, onMarkPaid, startIndex = 0 }: Props) {
  return (
    <div className="data-table-shell finance-table-shell">
      <table className="data-table finance-table">
        <thead>
          <tr>
            {['No. Tagihan', 'Murid & Program', mode === 'yearly' ? 'Periode' : 'Jatuh Tempo', 'Rincian', 'Total', 'Status', 'Aksi'].map((heading) => <th key={heading}>{heading}</th>)}
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && <tr><td colSpan={7} className="empty-table-cell">Tidak ada tagihan pada filter ini.</td></tr>}
          {payments.map((payment, rowIndex) => {
            const student = students.find((item) => item.id === payment.studentId);
            const program = student ? getProgramById(student.programId) : undefined;
            const dueState = getPaymentDueState(payment, TODAY);

            return (
              <tr key={payment.id}>
                <td>
                  <div className="numbered-invoice">
                    <span className="table-row-number">{startIndex + rowIndex + 1}</span>
                    <div>
                      <button type="button" className="invoice-link" onClick={() => onView(payment)}>{invoiceNumber(payment)}</button>
                      <small>Dibuat otomatis</small>
                    </div>
                  </div>
                </td>
                <td><strong>{student?.fullName ?? 'Murid tidak ditemukan'}</strong><small>{program?.name ?? '-'}</small></td>
                <td><strong>{mode === 'yearly' ? `${MONTH_NAMES[payment.month - 1]} ${payment.year}` : formatDate(payment.dueDate)}</strong>{payment.paidDate && <small>Dibayar {formatDate(payment.paidDate)}</small>}</td>
                <td><span>Les {formatCurrency(payment.programFee)}</span><small>{payment.registrationFee ? `Daftar ${formatCurrency(payment.registrationFee)}` : ''}{payment.registrationFee && payment.bookFee ? ' + ' : ''}{payment.bookFee ? `Buku ${formatCurrency(payment.bookFee)}` : ''}</small></td>
                <td className="money-cell">{formatCurrency(payment.total)}</td>
                <td>
                  <div className="payment-status-stack">
                    <span className={`badge badge-${dueState.status} due-badge-${dueState.tone}`}>{dueState.badgeLabel}</span>
                    <small className={`payment-due-note due-${dueState.tone}`}>{dueState.timingLabel}</small>
                  </div>
                </td>
                <td className="action-cell">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => onView(payment)}>Lihat</button>
                  {payment.status !== 'paid' && <button type="button" className="btn-primary btn-sm" onClick={() => onMarkPaid(payment)}>Lunasi</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
