import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, CreditCard, UserRound } from 'lucide-react';
import type { ParentOverview, ParentSession } from '../../../types';
import { formatCurrency, formatDate, paymentLabels, registrationLabels, type ParentPortalPage } from '../parentPortalConfig';

type Props = {
  overview: ParentOverview;
  sessions: ParentSession[];
  onNavigate: (page: ParentPortalPage) => void;
};

export default function ParentDashboardPage({ overview, sessions, onNavigate }: Props) {
  const pendingPayments = overview.payments.filter((payment) => payment.status !== 'paid');
  const pendingRegistrations = overview.registrations.filter((item) => item.status === 'pending');
  const pendingRequests = (overview.scheduleChangeRequests ?? []).filter((item) => item.status === 'pending');
  const latestRegistration = overview.registrations[0];

  return (
    <div className="parent-view-stack">
      <section className="parent-dashboard-welcome">
        <div><p>Portal Orang Tua</p><h2>Halo, {overview.user.name}</h2><span>Semua informasi penting anak sudah dirangkum untuk Anda.</span></div>
        <div className="parent-dashboard-date"><CalendarDays size={20} /><span><small>Hari ini</small>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
      </section>

      {pendingRegistrations.length > 0 && <section className="parent-notice-banner"><Clock3 size={22} /><div><strong>Pendaftaran sedang diperiksa</strong><span>Admin sedang memverifikasi data dan menyiapkan penempatan kelas.</span></div><button type="button" onClick={() => onNavigate('registrations')}>Lihat status <ArrowRight size={15} /></button></section>}

      <section className="parent-summary-grid">
        <button type="button" onClick={() => onNavigate('children')}><span className="cyan"><UserRound size={20} /></span><div><small>Anak aktif</small><strong>{overview.students.filter((student) => student.status === 'active').length}</strong><p>Data program dan pengajar</p></div></button>
        <button type="button" onClick={() => onNavigate('schedule')}><span className="amber"><CalendarDays size={20} /></span><div><small>Jadwal mingguan</small><strong>{sessions.length}</strong><p>Sesi belajar yang aktif</p></div></button>
        <button type="button" onClick={() => onNavigate('schedule-request')}><span className="violet"><CalendarClock size={20} /></span><div><small>Pengajuan aktif</small><strong>{pendingRequests.length}</strong><p>Jadwal atau paket menunggu Admin</p></div></button>
        <button type="button" onClick={() => onNavigate('payments')}><span className="rose"><CreditCard size={20} /></span><div><small>Tagihan aktif</small><strong>{pendingPayments.length}</strong><p>{pendingPayments.length ? formatCurrency(pendingPayments.reduce((sum, item) => sum + item.total, 0)) : 'Tidak ada tagihan'}</p></div></button>
      </section>

      <div className="parent-dashboard-columns">
        <section className="parent-content-panel">
          <header><div><h3>Jadwal terdekat</h3><p>Kelas yang sedang berlaku untuk anak.</p></div><button type="button" onClick={() => onNavigate('schedule')}>Lihat semua <ArrowRight size={15} /></button></header>
          <div className="parent-compact-list">{sessions.slice(0, 4).map((item) => <article key={item.id}><span className="parent-day-tile"><strong>{item.day.slice(0, 3)}</strong><small>{item.time}</small></span><div><strong>{item.programName}</strong><small>{item.teacherName} - {item.room}</small></div></article>)}{!sessions.length && <div className="parent-empty-inline"><CalendarDays size={24} /><span>Jadwal belum ditetapkan oleh Admin.</span></div>}</div>
        </section>

        <section className="parent-content-panel">
          <header><div><h3>Status pendaftaran</h3><p>Pembaruan terakhir dari Admin.</p></div><button type="button" onClick={() => onNavigate('registrations')}>Riwayat <ArrowRight size={15} /></button></header>
          {latestRegistration ? <article className="parent-latest-registration"><span className={`parent-status-pill ${latestRegistration.status}`}>{registrationLabels[latestRegistration.status]}</span><CheckCircle2 size={24} /><h3>{latestRegistration.childName}</h3><p>{latestRegistration.program?.name ?? latestRegistration.programId}</p><small>Dikirim {formatDate(latestRegistration.createdAt)}</small>{latestRegistration.adminNotes && <div>{latestRegistration.adminNotes}</div>}</article> : <div className="parent-empty-inline"><CheckCircle2 size={24} /><span>Belum ada riwayat pendaftaran.</span></div>}
        </section>
      </div>

      {overview.payments.length > 0 && <section className="parent-content-panel"><header><div><h3>Pembayaran terbaru</h3><p>Tiga transaksi atau tagihan terakhir.</p></div><button type="button" onClick={() => onNavigate('payments')}>Buka pembayaran <ArrowRight size={15} /></button></header><div className="parent-payment-preview">{overview.payments.slice(0, 3).map((payment) => <article key={payment.id}><div><strong>{formatCurrency(payment.total)}</strong><small>Jatuh tempo {formatDate(payment.dueDate)}</small></div><span className={`parent-status-pill ${payment.status}`}>{paymentLabels[payment.status]}</span></article>)}</div></section>}
    </div>
  );
}
