'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Check, Clock3, Eye, Mail, MapPin, MessageCircleMore, Phone, Search, UserRoundCheck, X, XCircle } from 'lucide-react';
import type { CourseRegistration, CourseRegistrationStatus, Page } from '../types';

type Props = {
  registrations: CourseRegistration[];
  onApprove: (id: string, note: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onNavigate: (page: Page, id?: string) => void;
};

const statusLabels: Record<CourseRegistrationStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function whatsappLink(phone = '', childName = '') {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`Halo, kami dari EdGLO ingin menindaklanjuti pendaftaran ${childName}.`)}`;
}

function registrationSchedules(registration: CourseRegistration) {
  if (registration.preferredSchedules?.length) return registration.preferredSchedules;
  return registration.preferredDays.map((day) => ({ day, time: registration.preferredTime }));
}

function registrationPrograms(registration: CourseRegistration) {
  if (registration.programSelections?.length) {
    return registration.programSelections.map((selection) => ({
      ...selection,
      programName: selection.programName ?? (selection.programId === registration.programId ? registration.program?.name : undefined) ?? selection.programId,
      sessionsPerWeek: selection.sessionsPerWeek ?? (selection.programId === registration.programId ? registration.program?.sessionsPerWeek : undefined),
    }));
  }

  return [{
    programId: registration.programId,
    programName: registration.program?.name ?? registration.programId,
    months: 1,
    sessionsPerWeek: registration.program?.sessionsPerWeek,
  }];
}

export default function Registrations({ registrations, onApprove, onReject, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CourseRegistrationStatus>('pending');
  const [selected, setSelected] = useState<CourseRegistration | null>(null);
  const [detail, setDetail] = useState<CourseRegistration | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const totals = useMemo(() => ({
    pending: registrations.filter((item) => item.status === 'pending').length,
    approved: registrations.filter((item) => item.status === 'approved').length,
    rejected: registrations.filter((item) => item.status === 'rejected').length,
  }), [registrations]);

  const filtered = useMemo(() => registrations.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [item.childName, item.parent.name, item.parent.phone, ...registrationPrograms(item).map((program) => program.programName)].some((value) => value?.toLowerCase().includes(keyword));
    return matchesSearch && (status === 'all' || item.status === status);
  }), [registrations, search, status]);

  const openAction = (registration: CourseRegistration, nextAction: 'approve' | 'reject') => {
    setDetail(null);
    setSelected(registration);
    setAction(nextAction);
    setNote('');
    setActionError('');
  };

  const submitAction = async () => {
    if (!selected || (action === 'reject' && !note.trim())) return;
    setSaving(true);
    setActionError('');
    try {
      if (action === 'approve') await onApprove(selected.id, note.trim());
      else await onReject(selected.id, note.trim());
      setSelected(null);
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Pendaftaran belum dapat diproses.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="registration-admin-page">
      <div className="registration-heading">
        <div><p className="eyebrow">Penerimaan murid</p><h2>Pendaftaran dari orang tua</h2><p>Periksa data calon murid sebelum dimasukkan ke database dan dijadwalkan.</p></div>
        <div className="registration-heading-note"><Clock3 size={18} /><span><strong>{totals.pending}</strong> pendaftaran perlu diperiksa</span></div>
      </div>

      <div className="registration-stats">
        <button type="button" onClick={() => setStatus('pending')} className={status === 'pending' ? 'active' : ''}><Clock3 size={20} /><span>Menunggu</span><strong>{totals.pending}</strong></button>
        <button type="button" onClick={() => setStatus('approved')} className={status === 'approved' ? 'active' : ''}><UserRoundCheck size={20} /><span>Disetujui</span><strong>{totals.approved}</strong></button>
        <button type="button" onClick={() => setStatus('rejected')} className={status === 'rejected' ? 'active' : ''}><XCircle size={20} /><span>Ditolak</span><strong>{totals.rejected}</strong></button>
      </div>

      <div className="registration-toolbar">
        <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari anak, orang tua, atau program..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Semua status</option><option value="pending">Menunggu</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option></select>
        <span>{filtered.length} data</span>
      </div>

      <div className="registration-table-wrap">
        <table className="registration-table">
          <thead><tr><th>No.</th><th>Calon murid</th><th>Orang tua</th><th>Program</th><th>Ketersediaan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>{filtered.map((item, index) => <tr key={item.id}>
            <td><span className="row-number">{index + 1}</span></td>
            <td><strong>{item.childName}</strong><small>{item.childAge} tahun - {formatDate(item.createdAt)}</small></td>
            <td><strong>{item.parent.name}</strong><small>{item.parent.phone || item.parent.email}</small></td>
            <td><strong>{registrationPrograms(item)[0].programName}</strong><small>{registrationPrograms(item)[0].months} bulan - {registrationPrograms(item)[0].sessionsPerWeek ?? '-'}x/minggu</small>{registrationPrograms(item).length > 1 && <small className="registration-more-programs">+{registrationPrograms(item).length - 1} program lainnya</small>}</td>
            <td><div className="preferred-days">{registrationSchedules(item).length ? registrationSchedules(item).map((schedule) => <span key={`${schedule.day}-${schedule.time}`}>{schedule.day.slice(0, 3)} {schedule.time && `- ${schedule.time}`}</span>) : <small>Belum dipilih</small>}</div><small>Preferensi orang tua</small></td>
            <td><span className={`registration-status ${item.status}`}>{statusLabels[item.status]}</span></td>
            <td><div className="registration-actions">
              <button type="button" className="detail" onClick={() => setDetail(item)}><Eye size={15} />Detail</button>
              {item.parent.phone && <a href={whatsappLink(item.parent.phone, item.childName)} target="_blank" rel="noreferrer" title="Hubungi lewat WhatsApp" aria-label={`Hubungi orang tua ${item.childName}`}><MessageCircleMore size={16} /></a>}
              {item.status === 'pending' && <><button type="button" className="approve" onClick={() => openAction(item, 'approve')}><Check size={15} />Setujui</button><button type="button" className="reject" onClick={() => openAction(item, 'reject')}><X size={15} />Tolak</button></>}
              {item.status === 'approved' && item.studentId && <button type="button" className="schedule" onClick={() => onNavigate('student-form', item.studentId)}>Atur Guru & Jadwal</button>}
            </div></td>
          </tr>)}</tbody>
        </table>
        {!filtered.length && <div className="registration-empty"><UserRoundCheck size={32} /><strong>Tidak ada data pada tampilan ini</strong><span>Pendaftaran baru dari landing page akan muncul otomatis.</span></div>}
      </div>

      {detail && <div className="registration-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="registration-detail-title" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}><div className="registration-modal registration-detail-modal"><button type="button" className="registration-modal-close" onClick={() => setDetail(null)} aria-label="Tutup detail"><X size={18} /></button>
        <div className="registration-detail-header"><span className={`registration-status ${detail.status}`}>{statusLabels[detail.status]}</span><h3 id="registration-detail-title">Detail pendaftaran</h3><p>{detail.id} - Dikirim {formatDate(detail.createdAt)}</p></div>
        <div className="registration-detail-grid">
          <section><span>Calon murid</span><strong>{detail.childName}</strong><small>{detail.childAge} tahun</small></section>
          <section><span>Program dan paket</span><div className="registration-program-list">{registrationPrograms(detail).map((program) => <div key={program.programId}><strong>{program.programName}</strong><small>{program.months} bulan - {program.sessionsPerWeek ?? '-'} sesi per minggu{program.monthlyPrice ? ` - ${formatCurrency(program.monthlyPrice)}/bulan` : ''}</small></div>)}</div></section>
          <section><span>Orang tua</span><strong>{detail.parent.name}</strong><small><Phone size={13} />{detail.parent.phone || '-'}</small><small><Mail size={13} />{detail.parent.email || 'Tidak dicantumkan'}</small></section>
          <section><span>Alamat</span><strong className="registration-detail-address"><MapPin size={14} />{detail.address}</strong></section>
        </div>
        <section className="registration-detail-section"><h4><CalendarClock size={18} />Waktu yang tersedia</h4><div className="registration-detail-schedules">{registrationSchedules(detail).map((schedule) => <span key={`${schedule.day}-${schedule.time}`}><strong>{schedule.day}</strong><small>{schedule.time ? `${schedule.time} WIB` : 'Jam fleksibel'}</small></span>)}</div><p>Orang tua mengirim {registrationSchedules(detail).length} pilihan waktu. Admin tetap mengonfirmasi guru dan jadwal final untuk setiap program melalui WhatsApp.</p></section>
        <section className="registration-detail-section"><h4>Catatan orang tua</h4><p className="registration-detail-note">{detail.notes || 'Tidak ada catatan tambahan.'}</p>{detail.adminNotes && <><h4 className="registration-admin-note-title">Catatan Admin</h4><p className="registration-detail-note">{detail.adminNotes}</p></>}</section>
        <div className="registration-modal-actions registration-detail-actions">
          {detail.parent.phone && <a className="btn-secondary" href={whatsappLink(detail.parent.phone, detail.childName)} target="_blank" rel="noreferrer"><MessageCircleMore size={16} />Hubungi Orang Tua</a>}
          {detail.status === 'pending' && <><button type="button" className="btn-danger" onClick={() => openAction(detail, 'reject')}><X size={16} />Tolak</button><button type="button" className="btn-primary" onClick={() => openAction(detail, 'approve')}><Check size={16} />Setujui</button></>}
          {detail.status === 'approved' && detail.studentId && <button type="button" className="btn-primary" onClick={() => { setDetail(null); onNavigate('student-form', detail.studentId); }}>Atur Guru & Jadwal</button>}
        </div>
      </div></div>}

      {selected && <div className="registration-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="registration-action-title"><div className="registration-modal"><button type="button" className="registration-modal-close" onClick={() => setSelected(null)} aria-label="Tutup"><X size={18} /></button><span className={`registration-modal-icon ${action}`} >{action === 'approve' ? <Check size={22} /> : <X size={22} />}</span><h3 id="registration-action-title">{action === 'approve' ? 'Setujui pendaftaran' : 'Tolak pendaftaran'}</h3><p>{action === 'approve' ? `${selected.childName} akan dibuat sebagai murid aktif dengan paket ${Math.max(...registrationPrograms(selected).map((program) => program.months))} bulan. Guru, jadwal, harga, dan promo dapat dikonfirmasi setelahnya.` : `Tuliskan alasan penolakan untuk catatan Admin dan tindak lanjut WhatsApp.`}</p><label>Catatan {action === 'reject' ? '*' : '(opsional)'}<textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder={action === 'approve' ? 'Contoh: Data lengkap. Promo dan jadwal sudah dikonfirmasi.' : 'Contoh: Nomor WhatsApp tidak dapat dihubungi.'} /></label>{actionError && <div className="registration-action-error" role="alert">{actionError}</div>}<div className="registration-modal-actions"><button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Batal</button><button type="button" className={action === 'approve' ? 'btn-primary' : 'btn-danger'} disabled={saving || (action === 'reject' && !note.trim())} onClick={() => void submitAction()}>{saving ? 'Menyimpan...' : action === 'approve' ? 'Setujui & Buat Murid' : 'Tolak Pendaftaran'}</button></div></div></div>}
    </div>
  );
}
