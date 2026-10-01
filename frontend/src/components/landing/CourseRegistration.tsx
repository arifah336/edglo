'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, LoaderCircle, X } from 'lucide-react';
import { api } from '../../lib/api';
import { getTimesForDay } from '../../data/mockData';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export type LandingProgram = {
  id: string;
  name: string;
  price: number;
  sessions: number;
};

type Props = {
  open: boolean;
  programs: LandingProgram[];
  initialProgram?: string;
  onClose: () => void;
};

export default function CourseRegistration({ open, programs, initialProgram = '', onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    parentName: '', email: '', phone: '', password: '', childName: '', age: '', address: '',
    program: initialProgram, preferredSchedules: [] as Array<{ day: string; time: string }>, notes: '',
  });
  const selectedProgram = programs.find((program) => program.id === form.program);
  const requiredDays = selectedProgram?.sessions ?? 0;
  const selectedDays = form.preferredSchedules.length;
  const scheduleRequirementMet = requiredDays > 0 && selectedDays > 0 && form.preferredSchedules.every((item) => item.time);

  if (!open) return null;

  const handleClose = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      preferredSchedules: current.preferredSchedules.some((item) => item.day === day)
        ? current.preferredSchedules.filter((item) => item.day !== day)
        : requiredDays > 0 && current.preferredSchedules.length < requiredDays
          ? [...current.preferredSchedules, { day, time: '' }]
          : current.preferredSchedules,
    }));
  };

  const setPreferredTime = (day: string, time: string) => {
    setForm((current) => ({
      ...current,
      preferredSchedules: current.preferredSchedules.map((item) => item.day === day ? { ...item, time } : item),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!selectedProgram) {
      setError('Pilih program terlebih dahulu.');
      return;
    }
    if (!form.preferredSchedules.length) {
      setError('Pilih minimal satu hari yang tersedia.');
      return;
    }
    if (form.preferredSchedules.some((item) => !item.time)) {
      setError('Lengkapi jam untuk setiap hari yang dipilih.');
      return;
    }
    setLoading(true);
    try {
      await api.registerCourse({
        parentName: form.parentName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        childName: form.childName.trim(),
        childAge: Number(form.age),
        address: form.address.trim(),
        programId: form.program,
        preferredSchedules: form.preferredSchedules,
        notes: form.notes.trim() || undefined,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pendaftaran belum dapat dikirim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-registration-dialog fixed inset-0 z-[100] flex items-center justify-center bg-[#08151d]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="registration-title" onMouseDown={(event) => event.target === event.currentTarget && handleClose()}>
      <div className="course-registration-panel relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-lg bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={handleClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Tutup formulir">
          <X size={19} />
        </button>

        {submitted ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32} /></div>
            <h2 id="registration-title" className="text-2xl font-extrabold text-slate-950">Pendaftaran sudah dicatat</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">Data sudah masuk ke antrean Admin. Tim EdGLO akan menghubungi Anda melalui WhatsApp setelah data diperiksa.</p>
            <button type="button" onClick={handleClose} className="mt-7 inline-flex h-11 items-center justify-center rounded-md bg-[#087f9b] px-6 text-sm font-bold text-white transition hover:bg-[#076b83]">Selesai</button>
          </div>
        ) : (
          <>
            <p className="text-xs font-extrabold uppercase text-[#087f9b]">Pendaftaran kursus</p>
            <h2 id="registration-title" className="mt-2 text-2xl font-extrabold text-slate-950">Temukan kelas yang pas untuk anak</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Akun portal dibuat bersamaan dengan pendaftaran. Admin akan memeriksa data sebelum menetapkan jadwal.</p>

            <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Nama orang tua
                <input required value={form.parentName} onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Nama lengkap orang tua" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Email untuk login
                <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="nama@email.com" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Password portal
                <input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Buat password" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Nomor WhatsApp
                <input required inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="08xxxxxxxxxx" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Nama anak
                <input required value={form.childName} onChange={(event) => setForm((current) => ({ ...current, childName: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Nama lengkap anak" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Usia anak
                <input required type="number" min="3" max="18" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Contoh: 8" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Alamat
                <textarea required rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="rounded-md border border-slate-300 bg-white px-3 py-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Alamat lengkap tempat tinggal" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Program yang diminati
                <select required value={form.program} onChange={(event) => { setError(''); setForm((current) => ({ ...current, program: event.target.value, preferredSchedules: [] })); }} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100">
                  <option value="">Pilih program</option>
                  {programs.map((program) => <option key={program.id} value={program.id}>{program.name} - {program.sessions}x/minggu - Rp {program.price.toLocaleString('id-ID')}/bulan</option>)}
                </select>
              </label>
              {selectedProgram && <div className="flex items-start justify-between gap-4 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm sm:col-span-2">
                <div>
                  <strong className="block text-slate-900">{selectedProgram.name}: {requiredDays} pertemuan per minggu</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Pilih 1 sampai {requiredDays} hari yang memungkinkan. Admin akan menghubungi orang tua dan melengkapi jadwal sesuai ketersediaan guru.</span>
                </div>
                <span className="shrink-0 rounded-md bg-white px-3 py-2 text-xs font-extrabold text-[#087f9b] shadow-sm">{selectedDays}/{requiredDays} hari dipilih</span>
              </div>}
              <fieldset className="grid gap-3 sm:col-span-2">
                <legend className="sr-only">Ketersediaan hari dan jam</legend>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-700">Ketersediaan hari dan jam</span>
                  {selectedProgram && <span className={`text-xs font-bold ${selectedDays > 0 ? 'text-emerald-600' : 'text-amber-700'}`}>{selectedDays > 0 ? `${selectedDays} hari dipilih` : 'Pilih minimal 1 hari'}</span>}
                </div>
                <p className="-mt-2 text-xs leading-5 text-slate-500">Pilihan ini adalah permintaan orang tua, bukan jadwal final. Orang tua tidak wajib langsung memilih seluruh hari pertemuan.</p>
                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
                  <Clock3 size={17} className="mt-0.5 shrink-0 text-[#087f9b]" />
                  <span><strong className="text-slate-800">Slot kelas tersedia:</strong> Senin-Jumat pukul 11.00, 12.00, 13.30, 15.00, dan 16.30. Sabtu pukul 09.00, 10.30, 12.00, dan 13.30.</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DAYS.map((day) => {
                    const schedule = form.preferredSchedules.find((item) => item.day === day);
                    const selectionFull = requiredDays > 0 && selectedDays >= requiredDays && !schedule;
                    return <div key={day} className={`grid grid-cols-[1fr_120px] items-center gap-3 rounded-md border p-3 transition ${schedule ? 'border-cyan-300 bg-cyan-50/70' : 'border-slate-200 bg-slate-50'}`}>
                      <label className={`flex items-center gap-2 text-sm font-bold ${!selectedProgram || selectionFull ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'}`}>
                        <input type="checkbox" checked={Boolean(schedule)} disabled={!selectedProgram || selectionFull} onChange={() => toggleDay(day)} className="h-4 w-4 accent-[#087f9b]" />
                        {day}
                      </label>
                      <select aria-label={`Jam pilihan ${day}`} required={Boolean(schedule)} disabled={!schedule} value={schedule?.time ?? ''} onChange={(event) => setPreferredTime(day, event.target.value)} className="h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                        <option value="">Pilih jam</option>
                        {getTimesForDay(day).map((time) => <option key={time} value={time.replace('.', ':')}>{time} WIB</option>)}
                      </select>
                    </div>;
                  })}
                </div>
              </fieldset>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Catatan kebutuhan dan fleksibilitas waktu
                <textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="rounded-md border border-slate-300 bg-white px-3 py-3 font-normal text-slate-950 outline-none transition focus:border-[#087f9b] focus:ring-4 focus:ring-cyan-100" placeholder="Contoh: Anak perlu pendampingan membaca. Jika jam pilihan penuh, kami bisa setelah pukul 16.00." />
              </label>
              {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2" role="alert">{error}</div>}
              <button type="submit" disabled={loading || !scheduleRequirementMet} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#087f9b] px-6 text-sm font-extrabold text-white shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:bg-[#076b83] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? 'Mengirim pendaftaran...' : scheduleRequirementMet ? 'Kirim Pendaftaran' : 'Lengkapi Pilihan Hari & Jam'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
