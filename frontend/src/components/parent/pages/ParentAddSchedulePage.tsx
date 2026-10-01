'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CalendarPlus, RefreshCw, Send } from 'lucide-react';
import type { ScheduleChangeReason, ScheduleChangeRequest, Student } from '../../../types';
import { api } from '../../../lib/api';
import { ALL_DAYS, getTimesForDay } from '../../../data/mockData';
import { reasonLabels } from '../parentPortalConfig';
import ParentAcademicRequestHistory from './ParentAcademicRequestHistory';

type Props = {
  token: string;
  students: Student[];
  requests: ScheduleChangeRequest[];
  onCreated: (request: ScheduleChangeRequest) => void;
};

export default function ParentAddSchedulePage({ token, students, requests, onCreated }: Props) {
  const activeStudents = useMemo(() => students.filter((student) => student.status === 'active'), [students]);
  const [studentId, setStudentId] = useState('');
  const [day, setDay] = useState('Senin');
  const [time, setTime] = useState(getTimesForDay('Senin')[0]);
  const [reason, setReason] = useState<ScheduleChangeReason>('learning_need');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selectedStudentId = studentId || activeStudents[0]?.id || '';
  const student = activeStudents.find((item) => item.id === selectedStudentId);
  const used = student?.schedules.length ?? 0;
  const quota = student?.sessionsPerWeek ?? 0;
  const remaining = Math.max(0, quota - used);

  const updateDay = (nextDay: string) => {
    setDay(nextDay);
    setTime(getTimesForDay(nextDay)[0]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!student || remaining < 1) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await api.createAcademicRequest(token, {
        requestType: 'add_schedule', studentId: student.id, requestedDay: day, requestedTime: time, reason, details,
      });
      onCreated(saved);
      setDetails('');
      setSuccess('Pengajuan jadwal tambahan sudah dikirim dan menunggu pemeriksaan Admin.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pengajuan belum dapat dikirim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Layanan Jadwal</p><h2>Ajukan jadwal tambahan</h2><span>Tambahkan sesi yang belum terisi tanpa melebihi kuota paket anak.</span></div><span className="parent-page-intro-note">Persetujuan mengikuti slot guru</span></section>
      <div className="parent-request-layout">
        <form onSubmit={submit} className="parent-schedule-request-form parent-content-panel">
          <header><div><h3>Form tambah jadwal</h3><p>Admin akan memeriksa kapasitas kelas dan ketersediaan pengajar.</p></div></header>
          <div className="parent-request-form-body">
            <label><span>Nama anak</span><select value={selectedStudentId} onChange={(event) => setStudentId(event.target.value)} required><option value="">Pilih anak</option>{activeStudents.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
            <div className={`parent-quota-card ${remaining ? '' : 'full'}`}><CalendarPlus size={20} /><div><small>Kuota paket {student?.program?.name ?? '-'}</small><strong>{used} dari {quota} jadwal sudah terisi</strong><span>{remaining ? `Masih tersedia ${remaining} jadwal untuk diajukan.` : 'Kuota penuh. Gunakan menu Ubah Paket untuk menambah jumlah pertemuan.'}</span></div></div>
            <div className="parent-request-form-grid"><label><span>Hari tambahan</span><select value={day} onChange={(event) => updateDay(event.target.value)} required>{ALL_DAYS.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Jam yang diinginkan</span><select value={time} onChange={(event) => setTime(event.target.value)} required>{getTimesForDay(day).map((item) => <option key={item}>{item}</option>)}</select></label></div>
            <label><span>Alasan penambahan</span><select value={reason} onChange={(event) => setReason(event.target.value as ScheduleChangeReason)}>{(['learning_need', 'family', 'other'] as ScheduleChangeReason[]).map((value) => <option key={value} value={value}>{reasonLabels[value]}</option>)}</select></label>
            <label><span>Keterangan kebutuhan</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} minLength={5} maxLength={1000} placeholder="Contoh: anak membutuhkan satu sesi tambahan untuk persiapan ujian." required /></label>
            {error && <div className="parent-form-message error">{error}</div>}{success && <div className="parent-form-message success">{success}</div>}
            <button type="submit" disabled={saving || !student || remaining < 1} className="parent-request-submit">{saving ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}{saving ? 'Mengirim pengajuan...' : 'Ajukan Tambah Jadwal'}</button>
          </div>
        </form>
        <aside className="parent-request-process"><h3>Ketentuan jadwal</h3><ol><li><span>1</span><div><strong>Cek kuota paket</strong><small>Jumlah pertemuan tidak boleh melampaui paket aktif.</small></div></li><li><span>2</span><div><strong>Admin cek slot</strong><small>Guru, ruang, dan kapasitas kelas akan diperiksa.</small></div></li><li><span>3</span><div><strong>Jadwal ditambahkan</strong><small>Sesi baru muncul setelah disetujui Admin.</small></div></li></ol></aside>
      </div>
      <ParentAcademicRequestHistory requests={requests} type="add_schedule" />
    </div>
  );
}
