'use client';

import { useMemo, useState } from 'react';
import { CalendarRange, GraduationCap, Pencil, Plus, Power, Tag, Trash2, WalletCards, X } from 'lucide-react';
import type { Program } from '../types';

type Props = {
  programs: Program[];
  onSave: (program: Program, originalId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type ProgramDraft = Omit<Program,
  | 'price'
  | 'sessionsPerWeek'
  | 'defaultPackageMonths'
  | 'billingCycleMonths'
  | 'registrationFee'
  | 'bookFee'
  | 'discountPercent'
  | 'discountMinMonths'
  | 'levelDurationMonths'
> & {
  price: number | '';
  sessionsPerWeek: number | '';
  defaultPackageMonths: number | '';
  billingCycleMonths: number | '';
  registrationFee: number | '';
  bookFee: number | '';
  discountPercent: number | '';
  discountMinMonths: number | '';
  levelDurationMonths: number | '';
};

type NumericDraftKey =
  | 'price'
  | 'sessionsPerWeek'
  | 'defaultPackageMonths'
  | 'billingCycleMonths'
  | 'registrationFee'
  | 'bookFee'
  | 'discountPercent'
  | 'discountMinMonths'
  | 'levelDurationMonths';

const emptyProgram: Program = {
  id: '',
  name: '',
  description: '',
  targetAge: '',
  price: 0,
  sessionsPerWeek: 3,
  defaultPackageMonths: 2,
  billingCycleMonths: 2,
  registrationFee: 0,
  bookFee: 0,
  discountPercent: 0,
  discountMinMonths: 2,
  levelOptions: [],
  levelDurationMonths: 4,
  isActive: true,
  activeStudentsCount: 0,
};

const withDefaults = (program: Program): Program => ({
  ...emptyProgram,
  ...program,
  levelOptions: program.levelOptions ?? [],
  isActive: program.isActive ?? true,
});

const toDraft = (program?: Program): ProgramDraft => {
  const next = withDefaults(program ?? emptyProgram);
  return {
    ...next,
    price: program ? next.price : '',
    sessionsPerWeek: next.sessionsPerWeek,
    defaultPackageMonths: next.defaultPackageMonths ?? 2,
    billingCycleMonths: next.billingCycleMonths ?? 2,
    registrationFee: program ? next.registrationFee ?? 0 : '',
    bookFee: program ? next.bookFee ?? 0 : '',
    discountPercent: program ? next.discountPercent ?? 0 : '',
    discountMinMonths: next.discountMinMonths ?? 2,
    levelDurationMonths: next.levelDurationMonths ?? '',
  };
};

const numberOr = (value: number | '' | undefined, fallback = 0) => value === '' || value === undefined ? fallback : value;

const formatNumberInput = (value: number | '' | undefined) => {
  if (value === '' || value === undefined) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
};

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const currency = (value = 0) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value);

export default function Programs({ programs, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<ProgramDraft | null>(null);
  const [originalId, setOriginalId] = useState<string>();
  const [levels, setLevels] = useState('');
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => ({
    active: programs.filter((program) => program.isActive ?? true).length,
    discounted: programs.filter((program) => (program.discountPercent ?? 0) > 0).length,
    students: programs.reduce((total, program) => total + (program.activeStudentsCount ?? 0), 0),
  }), [programs]);

  const openForm = (program?: Program) => {
    const next = toDraft(program);
    setEditing(next);
    setOriginalId(program?.id);
    setLevels((next.levelOptions ?? []).join(', '));
  };

  const update = <K extends keyof ProgramDraft>(key: K, value: ProgramDraft[K]) => {
    setEditing((current) => current ? { ...current, [key]: value } : current);
  };

  const updateNumber = (key: NumericDraftKey, value: string) => {
    setEditing((current) => current ? { ...current, [key]: value === '' ? '' : Number(value) } : current);
  };

  const updateCurrency = (key: 'price' | 'registrationFee' | 'bookFee', value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    updateNumber(key, digits);
  };

  const updateInteger = (key: NumericDraftKey, value: string, maximum: number) => {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    updateNumber(key, digits === '' ? '' : String(Math.min(Number(digits), maximum)));
  };

  const selectZeroOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.currentTarget.value.replace(/\./g, '') === '0') event.currentTarget.select();
  };

  const stopWheelChange = (event: React.WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const payload: Program = {
      ...editing,
      id: originalId ?? slugify(editing.name),
      price: numberOr(editing.price),
      sessionsPerWeek: numberOr(editing.sessionsPerWeek, 1),
      defaultPackageMonths: numberOr(editing.defaultPackageMonths, 1),
      billingCycleMonths: numberOr(editing.billingCycleMonths, 1),
      registrationFee: numberOr(editing.registrationFee),
      bookFee: numberOr(editing.bookFee),
      discountPercent: numberOr(editing.discountPercent),
      discountMinMonths: numberOr(editing.discountMinMonths, 1),
      levelDurationMonths: editing.levelDurationMonths === '' ? undefined : editing.levelDurationMonths,
      levelOptions: levels.split(',').map((level) => level.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      await onSave(payload, originalId);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (program: Program) => {
    await onSave({ ...withDefaults(program), isActive: !(program.isActive ?? true) }, program.id);
  };

  const remove = async (program: Program) => {
    if ((program.activeStudentsCount ?? 0) > 0) return;
    if (window.confirm(`Hapus program ${program.name}?`)) await onDelete(program.id);
  };

  const monthlyPrice = numberOr(editing?.price);
  const packageMonths = numberOr(editing?.defaultPackageMonths, 1);
  const discountMinimum = numberOr(editing?.discountMinMonths, 1);
  const discountPercent = packageMonths >= discountMinimum ? numberOr(editing?.discountPercent) : 0;
  const packageSubtotal = monthlyPrice * packageMonths;
  const packageTotal = Math.round(packageSubtotal * (1 - discountPercent / 100));

  return <div className="program-management">
    <section className="program-intro">
      <div>
        <span className="program-eyebrow">KATALOG PENDAFTARAN</span>
        <h2>Paket belajar EdGLO</h2>
        <p>Perubahan pada program aktif otomatis dipakai di landing page dan formulir pendaftaran calon murid.</p>
      </div>
      <button type="button" className="btn-primary program-add-button" onClick={() => openForm()}><Plus size={17} />Tambah Program</button>
    </section>

    <section className="program-summary" aria-label="Ringkasan program">
      <article><span><GraduationCap size={19} /></span><div><small>Program aktif</small><strong>{summary.active}</strong></div></article>
      <article><span><Tag size={19} /></span><div><small>Promo berjalan</small><strong>{summary.discounted}</strong></div></article>
      <article><span><CalendarRange size={19} /></span><div><small>Total program</small><strong>{programs.length}</strong></div></article>
      <article><span><WalletCards size={19} /></span><div><small>Murid aktif terhubung</small><strong>{summary.students}</strong></div></article>
    </section>

    <section className="program-table-shell">
      <div className="program-table-heading"><div><h3>Daftar program</h3><p>Nonaktifkan program agar tidak muncul pada pendaftaran tanpa menghapus riwayat murid.</p></div><span>{programs.length} program</span></div>
      <div className="program-table-scroll"><table className="program-table">
        <thead><tr><th>Program</th><th>Harga & pertemuan</th><th>Paket & tagihan</th><th>Promo</th><th>Level</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>{programs.map((program) => {
          const item = withDefaults(program);
          return <tr key={item.id}>
            <td><strong>{item.name}</strong><small>{item.targetAge || 'Target usia belum diatur'}</small><code>{item.id}</code></td>
            <td><strong>{currency(item.price)}</strong><small>{item.sessionsPerWeek}x per minggu</small></td>
            <td><strong>{item.defaultPackageMonths} bulan</strong><small>Ditagih tiap {item.billingCycleMonths} bulan</small></td>
            <td>{item.discountPercent ? <><strong>{item.discountPercent}%</strong><small>Mulai {item.discountMinMonths} bulan</small></> : <span className="program-empty">Tanpa diskon</span>}</td>
            <td><strong>{item.levelOptions?.length ? item.levelOptions.join(', ') : 'Tanpa level'}</strong>{item.levelOptions?.length ? <small>Evaluasi tiap {item.levelDurationMonths} bulan</small> : null}</td>
            <td><span className={`program-status ${item.isActive ? 'active' : 'off'}`}>{item.isActive ? 'Aktif' : 'Nonaktif'}</span><small>{item.activeStudentsCount ?? 0} murid aktif</small></td>
            <td><div className="program-actions"><button type="button" onClick={() => openForm(item)} title="Edit program" aria-label={`Edit ${item.name}`}><Pencil size={15} /></button><button type="button" onClick={() => void toggleStatus(item)} title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'} aria-label={`${item.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`}><Power size={15} /></button><button type="button" className="danger" disabled={(item.activeStudentsCount ?? 0) > 0} onClick={() => void remove(item)} title={(item.activeStudentsCount ?? 0) > 0 ? 'Program masih digunakan murid' : 'Hapus program'} aria-label={`Hapus ${item.name}`}><Trash2 size={15} /></button></div></td>
          </tr>;
        })}</tbody>
      </table></div>
      {!programs.length && <div className="program-empty-state"><GraduationCap size={28} /><strong>Belum ada program</strong><span>Tambahkan paket belajar pertama untuk mulai menerima pendaftaran.</span></div>}
    </section>

    {editing && <div className="modal-overlay program-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="program-form-title" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
      <form className="program-form" onSubmit={save}>
        <header><div><span className="program-eyebrow">PENGATURAN PROGRAM</span><h2 id="program-form-title">{originalId ? 'Edit program' : 'Tambah program'}</h2><p>Atur informasi yang dilihat calon murid dan aturan komersialnya.</p></div><button type="button" onClick={() => setEditing(null)} aria-label="Tutup"><X size={19} /></button></header>

        <div className="program-form-section"><h3>Informasi program</h3><div className="program-form-grid">
          <label className="wide">Nama program *<input required value={editing.name} onChange={(event) => update('name', event.target.value)} placeholder="Contoh: English Intensive" /></label>
          <label>Target usia<input value={editing.targetAge ?? ''} onChange={(event) => update('targetAge', event.target.value)} placeholder="Contoh: Usia 6-12 tahun" /></label>
          <label>Pertemuan per minggu *<input required type="number" min="1" max="6" value={editing.sessionsPerWeek} onWheel={stopWheelChange} onChange={(event) => updateNumber('sessionsPerWeek', event.target.value)} /></label>
          <label className="wide">Deskripsi<textarea rows={3} value={editing.description ?? ''} onChange={(event) => update('description', event.target.value)} placeholder="Jelaskan fokus dan hasil belajar program." /></label>
        </div></div>

        <div className="program-form-section"><h3>Harga dan paket</h3><div className="program-form-grid">
          <label>Harga per bulan *<input required type="text" inputMode="numeric" value={formatNumberInput(editing.price)} onFocus={selectZeroOnFocus} onChange={(event) => updateCurrency('price', event.target.value)} placeholder="Contoh: 600.000" autoComplete="off" /></label>
          <label>Durasi paket awal *<div className="input-suffix"><input required type="number" min="1" max="12" value={editing.defaultPackageMonths} onWheel={stopWheelChange} onChange={(event) => updateNumber('defaultPackageMonths', event.target.value)} /><span>bulan</span></div></label>
          <label>Ditagih setiap *<div className="input-suffix"><input required type="number" min="1" max="12" value={editing.billingCycleMonths} onWheel={stopWheelChange} onChange={(event) => updateNumber('billingCycleMonths', event.target.value)} /><span>bulan</span></div></label>
          <label>Biaya pendaftaran<input type="text" inputMode="numeric" value={formatNumberInput(editing.registrationFee)} onFocus={selectZeroOnFocus} onChange={(event) => updateCurrency('registrationFee', event.target.value)} placeholder="0" autoComplete="off" /></label>
          <label>Biaya buku<input type="text" inputMode="numeric" value={formatNumberInput(editing.bookFee)} onFocus={selectZeroOnFocus} onChange={(event) => updateCurrency('bookFee', event.target.value)} placeholder="0" autoComplete="off" /></label>
        </div></div>

        <div className="program-form-section"><h3>Promo dan level</h3><div className="program-form-grid">
          <label>Diskon paket<div className="input-suffix"><input type="text" inputMode="numeric" value={editing.discountPercent} onFocus={selectZeroOnFocus} onChange={(event) => updateInteger('discountPercent', event.target.value, 100)} placeholder="0" autoComplete="off" /><span>%</span></div></label>
          <label>Diskon berlaku mulai<div className="input-suffix"><input type="number" min="1" max="12" value={editing.discountMinMonths} onWheel={stopWheelChange} onChange={(event) => updateNumber('discountMinMonths', event.target.value)} /><span>bulan</span></div></label>
          <label className="wide">Pilihan level<input value={levels} onChange={(event) => setLevels(event.target.value)} placeholder="Contoh: A, B, C, Persiapan SD" /><small>Pisahkan setiap level dengan koma.</small></label>
          <label>Durasi setiap level<div className="input-suffix"><input type="number" min="1" max="24" value={editing.levelDurationMonths} onWheel={stopWheelChange} onChange={(event) => updateNumber('levelDurationMonths', event.target.value)} /><span>bulan</span></div></label>
          <label className="program-switch"><input type="checkbox" checked={editing.isActive ?? true} onChange={(event) => update('isActive', event.target.checked)} /><span><strong>Tampilkan di pendaftaran</strong><small>Program nonaktif tetap tersimpan untuk riwayat murid.</small></span></label>
        </div></div>

        <aside className="program-price-preview"><div><small>Harga per bulan</small><strong>{currency(monthlyPrice)}</strong></div><div><small>Total paket awal ({packageMonths} bulan)</small><strong>{currency(packageTotal)}</strong>{discountPercent > 0 && <em>Diskon {discountPercent}% dari {currency(packageSubtotal)}</em>}</div><span>Biaya terpisah: pendaftaran {currency(numberOr(editing.registrationFee))} dan buku {currency(numberOr(editing.bookFee))}</span></aside>
        <footer><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Batal</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Program'}</button></footer>
      </form>
    </div>}
  </div>;
}
