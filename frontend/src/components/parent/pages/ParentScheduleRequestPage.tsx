'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CalendarClock, RefreshCw, Send } from 'lucide-react';
import type { ParentSession, ScheduleChangeReason, ScheduleChangeRequest, Student } from '../../../types';
import { api } from '../../../lib/api';
import { ALL_DAYS, getTimesForDay } from '../../../data/mockData';
import { reasonLabels } from '../parentPortalConfig';
import ParentAcademicRequestHistory from './ParentAcademicRequestHistory';

type Props = {
  token: string;
  students: Student[];
  sessions: ParentSession[];
  requests: ScheduleChangeRequest[];
  onCreated: (request: ScheduleChangeRequest) => void;
};

type RequestForm = {
  studentId: string;
  currentSessionId: string;
  requestedDay: string;
  requestedTime: string;
  reason: ScheduleChangeReason;
  details: string;
};

const initialForm: RequestForm = {
  studentId: '', currentSessionId: '', requestedDay: 'Senin', requestedTime: '11.00', reason: 'school_conflict', details: '',
};

export default function ParentScheduleRequestPage({ token, students, sessions, requests, onCreated }: Props) {
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const activeStudents = useMemo(() => students.filter((student) => student.status === 'active'), [students]);
  const selectedStudentId = form.studentId || activeStudents[0]?.id || '';
  const studentSessions = useMemo(() => sessions.filter((item) => item.studentIds.includes(selectedStudentId)), [selectedStudentId, sessions]);
  const selectedSessionId = studentSessions.some((item) => item.id === form.currentSessionId) ? form.currentSessionId : studentSessions[0]?.id ?? '';
  const selectedSession = studentSessions.find((item) => item.id === selectedSessionId);

  const updateDay = (day: string) => setForm((current) => ({ ...current, requestedDay: day, requestedTime: getTimesForDay(day)[0] }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await api.createAcademicRequest(token, {
        ...form,
        requestType: 'change_schedule',
        studentId: selectedStudentId,
        currentSessionId: selectedSession.isClassSession === false ? undefined : selectedSessionId,
        currentDay: selectedSession.day,
        currentTime: selectedSession.time,
      });
      onCreated(saved);
      setForm((current) => ({ ...current, details: '' }));
      setSuccess('Permintaan sudah dikirim. Jadwal lama tetap berlaku sampai Admin menyetujuinya.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Permintaan belum dapat dikirim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="parent-view-stack">
      <section className="parent-page-intro"><div><p>Layanan Jadwal</p><h2>Ajukan perubahan jadwal</h2><span>Pilih kelas yang ingin dipindah dan jelaskan kebutuhan perubahan kepada Admin.</span></div><span className="parent-page-intro-note">Jadwal lama tetap aktif selama menunggu</span></section>

      <div className="parent-request-layout">
        <form onSubmit={submit} className="parent-schedule-request-form parent-content-panel">
          <header><div><h3>Form perubahan jadwal</h3><p>Program dan pengajar akan tetap sama.</p></div></header>
          <div className="parent-request-form-body">
            <div className="parent-request-form-grid">
              <label><span>Nama anak</span><select value={selectedStudentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value, currentSessionId: '' }))} required><option value="">Pilih anak</option>{activeStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label>
              <label><span>Jadwal yang ingin diubah</span><select value={selectedSessionId} onChange={(event) => setForm((current) => ({ ...current, currentSessionId: event.target.value }))} required disabled={!studentSessions.length}><option value="">{studentSessions.length ? 'Pilih jadwal' : 'Belum ada jadwal'}</option>{studentSessions.map((item) => <option key={item.id} value={item.id}>{item.day}, {item.time} - {item.programName}</option>)}</select></label>
            </div>
            {!studentSessions.length && <div className="parent-request-warning"><CalendarClock size={18} /><span>Belum ada jadwal yang dapat diubah. Admin perlu menetapkan pengajar dan jadwal anak terlebih dahulu.</span></div>}
            <div className="parent-selected-session"><span>Kelas terpilih</span><strong>{selectedSession ? `${selectedSession.programName} bersama ${selectedSession.teacherName}` : 'Pilih jadwal anak terlebih dahulu'}</strong><small>{selectedSession ? `${selectedSession.day}, ${selectedSession.time} WIB - ${selectedSession.room}` : 'Informasi pengajar tampil otomatis dari jadwal anak.'}</small></div>
            <div className="parent-request-form-grid"><label><span>Hari yang diinginkan</span><select value={form.requestedDay} onChange={(event) => updateDay(event.target.value)} required>{ALL_DAYS.map((day) => <option key={day}>{day}</option>)}</select></label><label><span>Jam yang diinginkan</span><select value={form.requestedTime} onChange={(event) => setForm((current) => ({ ...current, requestedTime: event.target.value }))} required>{getTimesForDay(form.requestedDay).map((time) => <option key={time}>{time}</option>)}</select></label></div>
            <label><span>Alasan perubahan</span><select value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value as ScheduleChangeReason }))}>{Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Keterangan kebutuhan</span><textarea value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} rows={4} minLength={5} maxLength={1000} placeholder="Contoh: jadwal sekolah berubah, sehingga anak baru bisa hadir setelah pukul 15.00." required /></label>
            {error && <div className="parent-form-message error">{error}</div>}{success && <div className="parent-form-message success">{success}</div>}
            <button type="submit" disabled={saving || !selectedSession} className="parent-request-submit">{saving ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}{saving ? 'Mengirim permintaan...' : 'Kirim ke Admin'}</button>
          </div>
        </form>

        <aside className="parent-request-process"><h3>Alur permintaan</h3><ol><li><span>1</span><div><strong>Kirim kebutuhan</strong><small>Pilih jadwal lama, waktu tujuan, dan alasannya.</small></div></li><li><span>2</span><div><strong>Admin memeriksa</strong><small>Kapasitas kelas serta jadwal pengajar akan dicek.</small></div></li><li><span>3</span><div><strong>Jadwal diperbarui</strong><small>Perubahan muncul otomatis setelah disetujui.</small></div></li></ol></aside>
      </div>

      <ParentAcademicRequestHistory requests={requests} type="change_schedule" />
    </div>
  );
}
