'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, Check, Clock3, Eye, Search, X, XCircle } from 'lucide-react';
import DataPagination from '../components/ui/DataPagination';
import type { AcademicRequestType, Page, ScheduleChangeReason, ScheduleChangeRequest, ScheduleChangeRequestStatus } from '../types';

type Props = {
  requests: ScheduleChangeRequest[];
  onApprove: (id: string, note: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onNavigate: (page: Page) => void;
};

const statusLabels: Record<ScheduleChangeRequestStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const reasonLabels: Record<ScheduleChangeReason, string> = {
  school_conflict: 'Bentrok sekolah',
  family: 'Keperluan keluarga',
  transport: 'Kendala transportasi',
  health: 'Kondisi kesehatan',
  learning_need: 'Kebutuhan belajar',
  package_adjustment: 'Penyesuaian paket',
  other: 'Alasan lainnya',
};

const typeLabels: Record<AcademicRequestType, string> = {
  change_schedule: 'Pindah jadwal',
  add_schedule: 'Tambah jadwal',
  change_program: 'Ganti paket',
};

const requestType = (item: ScheduleChangeRequest): AcademicRequestType => item.requestType ?? 'change_schedule';

function currentValue(item: ScheduleChangeRequest) {
  if (requestType(item) === 'change_program') return item.programName ?? '-';
  if (requestType(item) === 'add_schedule') return item.programName ?? '-';
  return `${item.currentDay ?? '-'}, ${item.currentTime ?? '-'}`;
}

function requestedValue(item: ScheduleChangeRequest) {
  if (requestType(item) === 'change_program') return item.requestedProgramName ?? '-';
  return `${item.requestedDay ?? '-'}, ${item.requestedTime ?? '-'}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ScheduleRequests({ requests, onApprove, onReject, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ScheduleChangeRequestStatus>('pending');
  const [type, setType] = useState<'all' | AcademicRequestType>('all');
  const [detail, setDetail] = useState<ScheduleChangeRequest | null>(null);
  const [selected, setSelected] = useState<ScheduleChangeRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totals = useMemo(() => ({
    pending: requests.filter((item) => item.status === 'pending').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    rejected: requests.filter((item) => item.status === 'rejected').length,
  }), [requests]);

  const filtered = useMemo(() => requests.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [item.studentName, item.parent?.name, item.parent?.phone, item.teacherName, item.programName, item.requestedProgramName]
      .some((value) => value?.toLowerCase().includes(keyword));
    return matchesSearch && (status === 'all' || item.status === status) && (type === 'all' || requestType(item) === type);
  }), [requests, search, status, type]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeStatus = (nextStatus: typeof status) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const openAction = (item: ScheduleChangeRequest, nextAction: 'approve' | 'reject') => {
    setDetail(null);
    setSelected(item);
    setAction(nextAction);
    setNote('');
    setActionError('');
  };

  const submitAction = async () => {
    if (!selected || (action === 'reject' && note.trim().length < 5)) return;
    setSaving(true);
    setActionError('');
    try {
      if (action === 'approve') await onApprove(selected.id, note.trim());
      else await onReject(selected.id, note.trim());
      setSelected(null);
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Permintaan belum dapat diproses.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="registration-admin-page">
      <div className="registration-heading">
        <div><p className="eyebrow">Layanan orang tua</p><h2>Pengajuan akademik</h2><p>Tinjau perpindahan jadwal, jadwal tambahan, dan perubahan paket dari orang tua.</p></div>
        <div className="registration-heading-note"><CalendarClock size={18} /><span><strong>{totals.pending}</strong> pengajuan perlu diproses</span></div>
      </div>

      <div className="registration-stats">
        <button type="button" onClick={() => changeStatus('pending')} className={status === 'pending' ? 'active' : ''}><Clock3 size={20} /><span>Menunggu</span><strong>{totals.pending}</strong></button>
        <button type="button" onClick={() => changeStatus('approved')} className={status === 'approved' ? 'active' : ''}><Check size={20} /><span>Disetujui</span><strong>{totals.approved}</strong></button>
        <button type="button" onClick={() => changeStatus('rejected')} className={status === 'rejected' ? 'active' : ''}><XCircle size={20} /><span>Ditolak</span><strong>{totals.rejected}</strong></button>
      </div>

      <div className="registration-toolbar">
        <label><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari murid, orang tua, guru, atau program..." /></label>
        <select value={type} onChange={(event) => { setType(event.target.value as typeof type); setPage(1); }}><option value="all">Semua jenis</option><option value="change_schedule">Pindah jadwal</option><option value="add_schedule">Tambah jadwal</option><option value="change_program">Ganti paket</option></select>
        <select value={status} onChange={(event) => changeStatus(event.target.value as typeof status)}><option value="all">Semua status</option><option value="pending">Menunggu</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option></select>
        <span>{filtered.length} data</span>
      </div>

      <div className="registration-table-wrap">
        <table className="registration-table schedule-request-table">
          <thead><tr><th>No.</th><th>Murid & orang tua</th><th>Jenis</th><th>Data saat ini</th><th>Yang diminta</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>{paged.map((item, index) => <tr key={item.id}>
            <td><span className="row-number">{(safePage - 1) * pageSize + index + 1}</span></td>
            <td><strong>{item.studentName}</strong><small>{item.parent?.name ?? '-'} - {item.parent?.phone ?? item.parent?.email ?? '-'}</small></td>
            <td><strong>{typeLabels[requestType(item)]}</strong><small>{item.programName ?? '-'}</small></td>
            <td><strong>{currentValue(item)}</strong><small>{requestType(item) === 'change_program' ? 'Paket aktif' : `Guru: ${item.teacherName ?? '-'}`}</small></td>
            <td><strong>{requestedValue(item)}</strong><small>Diajukan {formatDate(item.createdAt)}</small></td>
            <td><strong>{reasonLabels[item.reason]}</strong><small className="schedule-request-reason">{item.details}</small></td>
            <td><span className={`registration-status ${item.status}`}>{statusLabels[item.status]}</span></td>
            <td><div className="registration-actions"><button type="button" className="detail" onClick={() => setDetail(item)}><Eye size={15} />Detail</button>{item.status === 'pending' && <><button type="button" className="approve" onClick={() => openAction(item, 'approve')}><Check size={15} />Setujui</button><button type="button" className="reject" onClick={() => openAction(item, 'reject')}><X size={15} />Tolak</button></>}</div></td>
          </tr>)}</tbody>
        </table>
        {!filtered.length && <div className="registration-empty"><CalendarClock size={32} /><strong>Tidak ada permintaan pada tampilan ini</strong><span>Permintaan dari Portal Orang Tua akan muncul otomatis.</span></div>}
      </div>
      <DataPagination totalItems={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="permintaan" />

      {detail && <div className="registration-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="schedule-request-detail-title" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}><div className="registration-modal registration-detail-modal"><button type="button" className="registration-modal-close" onClick={() => setDetail(null)} aria-label="Tutup detail"><X size={18} /></button>
        <div className="registration-detail-header"><span className={`registration-status ${detail.status}`}>{statusLabels[detail.status]}</span><h3 id="schedule-request-detail-title">Detail {typeLabels[requestType(detail)].toLowerCase()}</h3><p>{detail.id} - Dikirim {formatDate(detail.createdAt)}</p></div>
        <div className="registration-detail-grid"><section><span>Murid</span><strong>{detail.studentName}</strong><small>{detail.programName}</small></section><section><span>Jenis pengajuan</span><strong>{typeLabels[requestType(detail)]}</strong><small>Guru: {detail.teacherName ?? '-'}</small></section><section><span>Orang tua</span><strong>{detail.parent?.name ?? '-'}</strong><small>{detail.parent?.phone ?? detail.parent?.email ?? '-'}</small></section><section><span>Alasan</span><strong>{reasonLabels[detail.reason]}</strong><small>{detail.details}</small></section></div>
        <section className="registration-detail-section"><h4><CalendarClock size={18} />Perubahan yang diminta</h4><div className="schedule-request-change"><span><small>{requestType(detail) === 'change_program' ? 'Paket saat ini' : requestType(detail) === 'add_schedule' ? 'Program' : 'Jadwal saat ini'}</small><strong>{currentValue(detail)}{requestType(detail) === 'change_schedule' ? ' WIB' : ''}</strong></span><ArrowRight size={20} /><span><small>{requestType(detail) === 'change_program' ? 'Paket tujuan' : requestType(detail) === 'add_schedule' ? 'Jadwal tambahan' : 'Jadwal tujuan'}</small><strong>{requestedValue(detail)}{requestType(detail) !== 'change_program' ? ' WIB' : ''}</strong></span></div><p>{requestType(detail) === 'change_program' ? 'Jika disetujui, paket diperbarui dan Admin perlu menentukan kembali guru serta jadwal murid.' : 'Persetujuan hanya berhasil bila tersedia kelas aktif dengan guru dan program yang sesuai serta kapasitas belum penuh.'}</p></section>
        {detail.adminNotes && <section className="registration-detail-section"><h4>Catatan Admin</h4><p className="registration-detail-note">{detail.adminNotes}</p></section>}
        <div className="registration-modal-actions registration-detail-actions"><button type="button" className="btn-secondary" onClick={() => onNavigate('schedule')}>Buka Jadwal Belajar</button>{detail.status === 'pending' && <><button type="button" className="btn-danger" onClick={() => openAction(detail, 'reject')}><X size={16} />Tolak</button><button type="button" className="btn-primary" onClick={() => openAction(detail, 'approve')}><Check size={16} />Setujui</button></>}</div>
      </div></div>}

      {selected && <div className="registration-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="schedule-request-action-title"><div className="registration-modal"><button type="button" className="registration-modal-close" onClick={() => setSelected(null)} aria-label="Tutup"><X size={18} /></button><span className={`registration-modal-icon ${action}`}>{action === 'approve' ? <Check size={22} /> : <X size={22} />}</span><h3 id="schedule-request-action-title">{action === 'approve' ? `Setujui ${typeLabels[requestType(selected)].toLowerCase()}` : 'Tolak pengajuan akademik'}</h3><p>{action === 'approve' ? `${selected.studentName}: ${currentValue(selected)} menjadi ${requestedValue(selected)}. Sistem akan memvalidasi data sebelum menerapkan perubahan.` : `Tuliskan alasan yang jelas untuk orang tua ${selected.studentName}.`}</p><label>Catatan {action === 'reject' ? '*' : '(opsional)'}<textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder={action === 'approve' ? 'Contoh: Perubahan mulai berlaku minggu depan.' : 'Contoh: Slot atau paket yang diminta belum tersedia.'} /></label>{actionError && <div className="registration-action-error" role="alert">{actionError}{action === 'approve' && requestType(selected) !== 'change_program' && <button type="button" className="schedule-request-error-link" onClick={() => { setSelected(null); onNavigate('schedule'); }}>Buka Jadwal Belajar</button>}</div>}<div className="registration-modal-actions"><button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Batal</button><button type="button" className={action === 'approve' ? 'btn-primary' : 'btn-danger'} disabled={saving || (action === 'reject' && note.trim().length < 5)} onClick={() => void submitAction()}>{saving ? 'Memproses...' : action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}</button></div></div></div>}
    </div>
  );
}
