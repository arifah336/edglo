'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, PackageOpen, RefreshCw, Send } from 'lucide-react';
import type { Program, ScheduleChangeRequest, Student } from '../../../types';
import { api } from '../../../lib/api';
import { formatCurrency } from '../parentPortalConfig';
import ParentAcademicRequestHistory from './ParentAcademicRequestHistory';

type Props = {
  token: string;
  students: Student[];
  programs: Program[];
  requests: ScheduleChangeRequest[];
  onCreated: (request: ScheduleChangeRequest) => void;
};

export default function ParentProgramRequestPage({ token, students, programs, requests, onCreated }: Props) {
  const activeStudents = useMemo(() => students.filter((student) => student.status === 'active'), [students]);
  const [studentId, setStudentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selectedStudentId = studentId || activeStudents[0]?.id || '';
  const student = activeStudents.find((item) => item.id === selectedStudentId);
  const availablePrograms = programs.filter((item) => item.id !== student?.programId);
  const selectedProgramId = availablePrograms.some((item) => item.id === programId) ? programId : availablePrograms[0]?.id ?? '';
  const targetProgram = availablePrograms.find((item) => item.id === selectedProgramId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!student || !targetProgram) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await api.createAcademicRequest(token, {
        requestType: 'change_program', studentId: student.id, requestedProgramId: targetProgram.id,
        reason: 'package_adjustment', details,
      });
      onCreated(saved);
      setDetails('');
      setSuccess('Pengajuan perubahan paket sudah dikirim. Paket lama tetap aktif selama menunggu Admin.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pengajuan belum dapat dikirim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Layanan Program</p><h2>Ajukan perubahan paket</h2><span>Pilih paket baru dan jelaskan kebutuhan belajar anak kepada Admin.</span></div><span className="parent-page-intro-note">Paket lama tetap aktif selama menunggu</span></section>
      <div className="parent-request-layout">
        <form onSubmit={submit} className="parent-schedule-request-form parent-content-panel">
          <header><div><h3>Form perubahan paket</h3><p>Biaya, jumlah pertemuan, guru, dan jadwal akan disusun ulang setelah disetujui.</p></div></header>
          <div className="parent-request-form-body">
            <label><span>Nama anak</span><select value={selectedStudentId} onChange={(event) => { setStudentId(event.target.value); setProgramId(''); }} required><option value="">Pilih anak</option>{activeStudents.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
            <label><span>Paket yang diinginkan</span><select value={selectedProgramId} onChange={(event) => setProgramId(event.target.value)} required disabled={!availablePrograms.length}><option value="">Pilih paket</option>{availablePrograms.map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}/bulan</option>)}</select></label>
            <div className="parent-program-comparison"><article><small>Paket saat ini</small><strong>{student?.program?.name ?? '-'}</strong><span>{student?.sessionsPerWeek ?? 0} pertemuan/minggu</span></article><ArrowRight size={20} /><article className="target"><small>Paket tujuan</small><strong>{targetProgram?.name ?? '-'}</strong><span>{targetProgram ? `${targetProgram.sessionsPerWeek} pertemuan/minggu - ${formatCurrency(targetProgram.price)}/bulan` : '-'}</span></article></div>
            <label><span>Alasan dan kebutuhan</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={5} minLength={5} maxLength={1000} placeholder="Contoh: anak membutuhkan frekuensi belajar lebih banyak mulai bulan depan." required /></label>
            <div className="parent-request-warning"><PackageOpen size={18} /><span>Setelah disetujui, Admin perlu menentukan kembali guru dan jadwal yang sesuai dengan paket baru.</span></div>
            {error && <div className="parent-form-message error">{error}</div>}{success && <div className="parent-form-message success">{success}</div>}
            <button type="submit" disabled={saving || !student || !targetProgram} className="parent-request-submit">{saving ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}{saving ? 'Mengirim pengajuan...' : 'Ajukan Ubah Paket'}</button>
          </div>
        </form>
        <aside className="parent-request-process"><h3>Alur perubahan paket</h3><ol><li><span>1</span><div><strong>Pilih paket tujuan</strong><small>Bandingkan biaya dan jumlah pertemuan mingguan.</small></div></li><li><span>2</span><div><strong>Admin menghubungi Anda</strong><small>Biaya efektif dan waktu mulai akan dikonfirmasi.</small></div></li><li><span>3</span><div><strong>Penempatan ulang</strong><small>Guru dan jadwal disusun untuk paket baru.</small></div></li></ol></aside>
      </div>
      <ParentAcademicRequestHistory requests={requests} type="change_program" />
    </div>
  );
}
