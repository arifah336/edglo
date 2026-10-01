import { ArrowRight, CalendarClock, CheckCircle2, PackageOpen } from 'lucide-react';
import type { AcademicRequestType, ScheduleChangeRequest } from '../../../types';
import { formatDate, reasonLabels, requestStatusLabels, requestTypeLabels } from '../parentPortalConfig';

type Props = {
  requests: ScheduleChangeRequest[];
  type: AcademicRequestType;
};

export default function ParentAcademicRequestHistory({ requests, type }: Props) {
  const filtered = requests.filter((item) => (item.requestType ?? 'change_schedule') === type);

  return (
    <section className="parent-content-panel">
      <header><div><h3>Riwayat pengajuan</h3><p>Keputusan dan catatan Admin tersimpan di sini.</p></div><span>{filtered.length} pengajuan</span></header>
      {filtered.length ? <div className="parent-request-history">{filtered.map((item) => <article key={item.id}>
        <div className="parent-request-history-head"><div><span className="parent-request-kind">{requestTypeLabels[item.requestType ?? 'change_schedule']}</span><strong>{item.studentName}</strong><small>{formatDate(item.createdAt)} - {item.teacherName ?? 'Pengajar belum tersedia'}</small></div><span className={`parent-status-pill ${item.status}`}>{requestStatusLabels[item.status]}</span></div>
        {type === 'change_program' ? <div className="parent-request-change"><span><small>Paket saat ini</small><strong>{item.programName ?? '-'}</strong></span><ArrowRight size={17} /><span><small>Paket tujuan</small><strong>{item.requestedProgramName ?? '-'}</strong></span></div> : <div className="parent-request-change">{type === 'change_schedule' && <><span><small>Dari</small><strong>{item.currentDay}, {item.currentTime}</strong></span><ArrowRight size={17} /></>}<span><small>{type === 'add_schedule' ? 'Jadwal tambahan' : 'Ke'}</small><strong>{item.requestedDay}, {item.requestedTime}</strong></span></div>}
        <p><strong>{reasonLabels[item.reason]}:</strong> {item.details}</p>
        {item.adminNotes && <div className="parent-admin-note"><CheckCircle2 size={15} /><span><strong>Catatan Admin</strong>{item.adminNotes}</span></div>}
      </article>)}</div> : <div className="parent-empty-inline">{type === 'change_program' ? <PackageOpen size={24} /> : <CalendarClock size={24} />}<span>Belum ada pengajuan {requestTypeLabels[type].toLowerCase()}.</span></div>}
    </section>
  );
}
