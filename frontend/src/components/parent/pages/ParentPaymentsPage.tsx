import { CheckCircle2, Clock3, CreditCard } from 'lucide-react';
import type { Payment } from '../../../types';
import { formatCurrency, formatDate, paymentLabels } from '../parentPortalConfig';

export default function ParentPaymentsPage({ payments }: { payments: Payment[] }) {
  const paid = payments.filter((item) => item.status === 'paid');
  const outstanding = payments.filter((item) => item.status !== 'paid');
  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Administrasi</p><h2>Tagihan & pembayaran</h2><span>Pantau jatuh tempo dan riwayat pembayaran anak.</span></div></section>
      <section className="parent-payment-summary"><article><span className="cyan"><CreditCard size={20} /></span><div><small>Total tagihan</small><strong>{payments.length}</strong></div></article><article><span className="emerald"><CheckCircle2 size={20} /></span><div><small>Sudah lunas</small><strong>{paid.length}</strong></div></article><article><span className="amber"><Clock3 size={20} /></span><div><small>Perlu dibayar</small><strong>{formatCurrency(outstanding.reduce((sum, item) => sum + item.total, 0))}</strong></div></article></section>
      {payments.length ? <section className="parent-content-panel parent-payment-table-panel"><header><div><h3>Riwayat pembayaran</h3><p>Daftar tagihan terbaru hingga terlama.</p></div></header><div className="parent-payment-table"><div className="parent-payment-table-head"><span>Tagihan</span><span>Jatuh tempo</span><span>Total</span><span>Status</span></div>{payments.map((payment) => <article key={payment.id}><div><strong>Tagihan {String(payment.month).padStart(2, '0')}/{payment.year}</strong><small>{payment.id}</small></div><span>{formatDate(payment.dueDate)}</span><strong>{formatCurrency(payment.total)}</strong><span className={`parent-status-pill ${payment.status}`}>{paymentLabels[payment.status]}</span></article>)}</div></section> : <section className="parent-empty-page"><CreditCard size={36} /><h3>Belum ada tagihan</h3><p>Tagihan akan tampil setelah Admin membuat periode pembayaran.</p></section>}
    </div>
  );
}
