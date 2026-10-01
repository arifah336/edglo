'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, LoaderCircle, PackageCheck, X } from 'lucide-react';
import { api } from '../../lib/api';
import { getTimesForDay } from '../../data/mockData';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type LandingProgram = {
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

type ProgramChoice = { programId: string; months: number };

export default function PublicCourseRegistration({ open, programs, initialProgram = '', onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    parentName: '', email: '', phone: '', childName: '', age: '', address: '',
    programSelections: (initialProgram ? [{ programId: initialProgram, months: 1 }] : []) as ProgramChoice[],
    preferredSchedules: [] as Array<{ day: string; time: string }>, notes: '',
  });

  if (!open) return null;

  const selectedPrograms = form.programSelections.map((choice) => ({
    ...choice,
    program: programs.find((program) => program.id === choice.programId),
  })).filter((item) => item.program);
  const highestFrequency = Math.max(0, ...selectedPrograms.map((item) => item.program?.sessions ?? 0));

  const close = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  const toggleProgram = (programId: string) => {
    setForm((current) => ({
      ...current,
      programSelections: current.programSelections.some((item) => item.programId === programId)
        ? current.programSelections.filter((item) => item.programId !== programId)
        : current.programSelections.length < 3
          ? [...current.programSelections, { programId, months: 1 }]
          : current.programSelections,
    }));
  };

  const setMonths = (programId: string, months: number) => {
    setForm((current) => ({
      ...current,
      programSelections: current.programSelections.map((item) => item.programId === programId ? { ...item, months } : item),
    }));
  };

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      preferredSchedules: current.preferredSchedules.some((item) => item.day === day)
        ? current.preferredSchedules.filter((item) => item.day !== day)
        : [...current.preferredSchedules, { day, time: '' }],
    }));
  };

  const setPreferredTime = (day: string, time: string) => {
    setForm((current) => ({
      ...current,
      preferredSchedules: current.preferredSchedules.map((item) => item.day === day ? { ...item, time } : item),
    }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!form.programSelections.length) return setError('Pilih minimal satu program.');
    if (!form.preferredSchedules.length || form.preferredSchedules.some((item) => !item.time)) {
      return setError('Pilih minimal satu hari dan lengkapi jam yang tersedia.');
    }

    setLoading(true);
    try {
      await api.registerCourse({
        parentName: form.parentName.trim(),
        email: form.email.trim().toLowerCase() || undefined,
        phone: form.phone.trim(),
        childName: form.childName.trim(),
        childAge: Number(form.age),
        address: form.address.trim(),
        programSelections: form.programSelections,
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
    <div className="course-registration-dialog fixed inset-0 z-[100] flex items-center justify-center bg-[#08151d]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="registration-title" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="course-registration-panel relative max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-lg bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={close} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100" aria-label="Tutup formulir"><X size={19} /></button>
        {submitted ? <div className="py-12 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32} /></div>
          <h2 id="registration-title" className="text-2xl font-extrabold text-slate-950">Data berhasil dikirim</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Pendaftaran masuk ke antrean Admin EdGLO. Tim kami akan menghubungi nomor WhatsApp yang dicantumkan setelah data diperiksa.</p>
          <button type="button" onClick={close} className="mt-7 inline-flex h-11 items-center rounded-md bg-[#087f9b] px-6 text-sm font-bold text-white">Selesai</button>
        </div> : <>
          <p className="text-xs font-extrabold uppercase text-[#087f9b]">Form calon murid</p>
          <h2 id="registration-title" className="mt-2 pr-12 text-2xl font-extrabold text-slate-950">Lengkapi data pendaftaran EdGLO</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Form ini tidak membuat akun. Admin akan memeriksa data, menghubungi orang tua, lalu menetapkan guru dan jadwal setelah pendaftaran disetujui.</p>

          <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Nama orang tua<input required value={form.parentName} onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950" placeholder="Nama lengkap orang tua" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">Nomor WhatsApp<input required inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950" placeholder="08xxxxxxxxxx" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">Email <small className="font-normal text-slate-400">Opsional, bukan untuk login</small><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950" placeholder="nama@email.com" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">Nama anak<input required value={form.childName} onChange={(event) => setForm((current) => ({ ...current, childName: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950" placeholder="Nama lengkap anak" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">Usia anak<input required type="number" min="3" max="18" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} className="h-11 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950" placeholder="Contoh: 8" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Alamat<textarea required rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="rounded-md border border-slate-300 bg-white px-3 py-3 font-normal text-slate-950" placeholder="Alamat lengkap tempat tinggal" /></label>

            <fieldset className="grid gap-3 sm:col-span-2">
              <div><legend className="text-sm font-bold text-slate-800">Program dan durasi paket</legend><p className="mt-1 text-xs leading-5 text-slate-500">Boleh memilih sampai 3 program. Durasi 1, 2, atau 3 bulan akan dikonfirmasi kembali oleh Admin, termasuk promo yang berlaku.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">{programs.map((program) => {
                const choice = form.programSelections.find((item) => item.programId === program.id);
                const disabled = !choice && form.programSelections.length >= 3;
                return <div key={program.id} className={`rounded-md border p-4 ${choice ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white'}`}>
                  <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}><input type="checkbox" checked={Boolean(choice)} disabled={disabled} onChange={() => toggleProgram(program.id)} className="mt-1 h-4 w-4 accent-[#087f9b]" /><span className="min-w-0"><strong className="block text-sm text-slate-950">{program.name}</strong><small className="mt-1 block text-xs text-slate-500">{program.sessions}x seminggu - Rp {program.price.toLocaleString('id-ID')}/bulan</small></span></label>
                  {choice && <label className="mt-4 grid gap-1 text-xs font-bold text-slate-600">Durasi paket<select value={choice.months} onChange={(event) => setMonths(program.id, Number(event.target.value))} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"><option value={1}>1 bulan</option><option value={2}>2 bulan</option><option value={3}>3 bulan / opsi promo 2+1</option></select></label>}
                </div>;
              })}</div>
              {selectedPrograms.length > 0 && <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3"><PackageCheck size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><strong className="text-sm text-slate-900">{selectedPrograms.length} program dipilih</strong><p className="mt-1 text-xs leading-5 text-slate-600">Regular berjalan 3x seminggu dan Everyday 5x seminggu. Frekuensi tertinggi pilihan saat ini {highestFrequency}x seminggu. Nominal akhir mengikuti promo yang dikonfirmasi Admin.</p></div></div>}
            </fieldset>

            <fieldset className="grid gap-3 sm:col-span-2"><div><legend className="text-sm font-bold text-slate-800">Ketersediaan hari dan jam</legend><p className="mt-1 text-xs leading-5 text-slate-500">Cukup isi hari yang memungkinkan. Ini belum menjadi jadwal final; Admin akan mencocokkannya dengan program dan guru.</p></div>
              <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600"><Clock3 size={17} className="mt-0.5 shrink-0 text-[#087f9b]" /><span>Senin-Jumat: 11.00, 12.00, 13.30, 15.00, 16.30. Sabtu: 09.00, 10.30, 12.00, 13.30.</span></div>
              <div className="grid gap-2 sm:grid-cols-2">{DAYS.map((day) => {
                const schedule = form.preferredSchedules.find((item) => item.day === day);
                return <div key={day} className={`grid grid-cols-[1fr_120px] items-center gap-3 rounded-md border p-3 ${schedule ? 'border-cyan-300 bg-cyan-50/70' : 'border-slate-200 bg-slate-50'}`}><label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(schedule)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-[#087f9b]" />{day}</label><select aria-label={`Jam pilihan ${day}`} required={Boolean(schedule)} disabled={!schedule} value={schedule?.time ?? ''} onChange={(event) => setPreferredTime(day, event.target.value)} className="h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-950 disabled:bg-slate-100"><option value="">Pilih jam</option>{getTimesForDay(day).map((time) => <option key={time} value={time.replace('.', ':')}>{time} WIB</option>)}</select></div>;
              })}</div>
            </fieldset>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Catatan kebutuhan<textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="rounded-md border border-slate-300 bg-white px-3 py-3 font-normal text-slate-950" placeholder="Kebutuhan belajar, waktu alternatif, atau informasi penting lainnya." /></label>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2" role="alert">{error}</div>}
            <button type="submit" disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#087f9b] px-6 text-sm font-extrabold text-white disabled:opacity-50 sm:col-span-2">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? 'Mengirim pendaftaran...' : 'Kirim ke Admin EdGLO'}</button>
          </form>
        </>}
      </div>
    </div>
  );
}
