import { CalendarClock, CheckCircle2, ClipboardCheck } from 'lucide-react';
import type { CourseRegistration } from '../../../types';
import { formatDate, registrationLabels } from '../parentPortalConfig';

function schedules(registration: CourseRegistration) {
  if (registration.preferredSchedules?.length) return registration.preferredSchedules;
  return registration.preferredDays.map((day) => ({ day, time: registration.preferredTime }));
}

export default function ParentRegistrationsPage({ registrations }: { registrations: CourseRegistration[] }) {
  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Penerimaan Murid</p><h2>Riwayat pendaftaran</h2><span>Lihat data yang diajukan dan keputusan dari Admin EdGLO.</span></div></section>
      {registrations.length ? <section className="parent-registration-list">{registrations.map((item) => <article key={item.id}>
        <header><div><span className={`parent-status-pill ${item.status}`}>{registrationLabels[item.status]}</span><h3>{item.childName}</h3><p>{item.program?.name ?? item.programId}</p></div><small>{formatDate(item.createdAt)}</small></header>
        <div className="parent-registration-meta"><span><ClipboardCheck size={15} />{item.childAge} tahun</span><span><CalendarClock size={15} />{schedules(item).length} pilihan waktu</span></div>
        <div className="parent-registration-schedules">{schedules(item).map((schedule) => <span key={`${schedule.day}-${schedule.time}`}>{schedule.day}, {schedule.time || 'fleksibel'}</span>)}</div>
        {item.notes && <div className="parent-registration-note"><strong>Catatan pendaftaran</strong><p>{item.notes}</p></div>}
        {item.adminNotes && <div className="parent-registration-note admin"><strong><CheckCircle2 size={14} />Catatan Admin</strong><p>{item.adminNotes}</p></div>}
      </article>)}</section> : <section className="parent-empty-page"><ClipboardCheck size={36} /><h3>Belum ada pendaftaran</h3><p>Pendaftaran kursus dari halaman utama akan muncul di sini.</p></section>}
    </div>
  );
}
