'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type ComponentType } from 'react';
import {
  ArrowRight, BarChart3, BookOpenCheck, CalendarDays, Check, ChevronDown,
  Clock3, GraduationCap, Languages, Menu, MessageCircleMore, MonitorCheck,
  ShieldCheck, Sparkles, Star, Target, TrendingUp, UserRoundCheck, UsersRound, X,
} from 'lucide-react';
import { PROGRAMS } from '../../data/mockData';
import CourseRegistration from './CourseRegistration';
import { CountUp, ScrollReveal, SplitText, SpotlightCard } from './ReactBits';

type IconType = ComponentType<{ size?: number; className?: string }>;

const programDetails: Record<string, { group: string; ages: string; description: string; accent: string; benefits: string[] }> = {
  'pra-calistung-regular': { group: 'Calistung', ages: 'Usia 4-6 tahun', description: 'Fondasi membaca, menulis, dan berhitung melalui aktivitas menyenangkan.', accent: '#f3ad18', benefits: ['Materi pra-sekolah', 'Kelas kelompok kecil', 'Evaluasi perkembangan'] },
  'calistung-regular': { group: 'Calistung', ages: 'Usia 5-8 tahun', description: 'Latihan calistung terstruktur untuk membangun ketepatan dan percaya diri.', accent: '#0b8eaa', benefits: ['3 sesi per minggu', 'Latihan bertahap', 'Laporan ke orang tua'] },
  'calistung-everyday': { group: 'Calistung', ages: 'Usia 5-8 tahun', description: 'Pendampingan intensif lima hari untuk progres belajar yang konsisten.', accent: '#ee5c72', benefits: ['5 sesi per minggu', 'Pendampingan intensif', 'Target belajar personal'] },
  'bimbel-regular': { group: 'Bimbel', ages: 'SD kelas 1-6', description: 'Pendampingan tugas sekolah dan penguatan konsep pelajaran utama.', accent: '#6458d8', benefits: ['3 sesi per minggu', 'Bantuan tugas sekolah', 'Persiapan ulangan'] },
  'bimbel-everyday': { group: 'Bimbel', ages: 'SD kelas 1-6', description: 'Belajar rutin setiap hari sekolah agar materi tidak menumpuk.', accent: '#1ca66f', benefits: ['5 sesi per minggu', 'Jadwal belajar rutin', 'Review materi harian'] },
  'english-regular': { group: 'English', ages: 'Usia 6-12 tahun', description: 'Bahasa Inggris praktis dengan fokus vocabulary, speaking, dan confidence.', accent: '#397ee8', benefits: ['3 sesi per minggu', 'Speaking practice', 'Aktivitas interaktif'] },
  'english-everyday': { group: 'English', ages: 'Usia 6-12 tahun', description: 'Paparan Bahasa Inggris lebih sering untuk membangun kebiasaan berbahasa.', accent: '#f07832', benefits: ['5 sesi per minggu', 'Daily conversation', 'Progress challenge'] },
};

const benefits: { icon: IconType; title: string; description: string }[] = [
  { icon: UserRoundCheck, title: 'Guru yang sesuai', description: 'Penempatan guru mempertimbangkan program dan kebutuhan belajar anak.' },
  { icon: Target, title: 'Target personal', description: 'Fokus belajar dibuat spesifik, bertahap, dan mudah dievaluasi.' },
  { icon: CalendarDays, title: 'Jadwal teratur', description: 'Orang tua mengetahui hari, jam, dan guru yang bertugas.' },
  { icon: MessageCircleMore, title: 'Komunikasi terbuka', description: 'Catatan penting dapat ditindaklanjuti bersama orang tua.' },
];

const parentFeatures: { icon: IconType; title: string; description: string }[] = [
  { icon: MonitorCheck, title: 'Ringkasan perkembangan', description: 'Lihat fokus belajar dan catatan terbaru dari guru.' },
  { icon: Clock3, title: 'Jadwal yang selalu jelas', description: 'Hari, jam, program, dan guru ada dalam satu tampilan.' },
  { icon: ShieldCheck, title: 'Data keluarga terlindungi', description: 'Akses menggunakan akun orang tua yang terdaftar.' },
];

const testimonials = [
  { quote: 'Sekarang Aisyah lebih percaya diri membaca dan selalu menunggu jadwal belajarnya.', name: 'Wahyu Hidayat', role: 'Orang tua murid Calistung' },
  { quote: 'Jadwal, tagihan, dan perkembangan anak bisa saya pantau tanpa bertanya satu per satu.', name: 'Dewi Santoso', role: 'Orang tua murid English' },
  { quote: 'Gurunya komunikatif. Target belajar dijelaskan dengan bahasa yang mudah dipahami.', name: 'Hendra Rahayu', role: 'Orang tua murid Bimbel' },
];

const faqs = [
  ['Apakah bisa konsultasi sebelum memilih program?', 'Bisa. Tim EdGLO akan melihat usia, kebutuhan belajar, dan jadwal anak sebelum merekomendasikan program.'],
  ['Berapa jumlah pertemuan setiap minggu?', 'Program Regular memiliki 3 sesi per minggu, sedangkan program Everyday memiliki 5 sesi per minggu.'],
  ['Apakah orang tua mendapat laporan perkembangan?', 'Ya. Orang tua dapat memantau jadwal, pembayaran, catatan guru, dan perkembangan melalui portal.'],
  ['Apakah jadwal belajar dapat dipilih?', 'Pilihan jadwal dibicarakan saat konsultasi dan disesuaikan dengan kelas serta guru yang tersedia.'],
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState('Semua');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const programs = useMemo(() => PROGRAMS.map((program) => ({
    id: program.id, name: program.name, price: program.price, sessions: program.sessionsPerWeek,
    ...programDetails[program.id],
  })), []);
  const visiblePrograms = filter === 'Semua' ? programs : programs.filter((program) => program.group === filter);

  const openRegistration = (programId = '') => {
    setSelectedProgram(programId);
    setRegistrationOpen(true);
  };

  return (
    <main className="landing-page min-h-screen bg-[#f7fafb] text-slate-950">
      <section className="relative h-[calc(100svh-44px)] min-h-[680px] max-h-[840px] overflow-hidden bg-[#0d222c] text-white">
        <Image src="/edglo-classroom.jpg" alt="Kegiatan belajar bersama di kelas" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-[#06151dcc]" />

        <header className="relative z-20 border-b border-white/15">
          <div className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 lg:px-8">
            <Link href="/" aria-label="Beranda EdGLO" className="inline-flex h-20 w-[170px] items-center overflow-hidden">
              <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} className="object-cover" priority />
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-bold text-white/80 lg:flex" aria-label="Navigasi utama">
              <a href="#program" className="transition hover:text-white">Program</a>
              <a href="#keunggulan" className="transition hover:text-white">Keunggulan</a>
              <a href="#orang-tua" className="transition hover:text-white">Untuk Orang Tua</a>
              <a href="#testimoni" className="transition hover:text-white">Cerita Orang Tua</a>
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-md border border-white/30 px-4 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950">Masuk Admin</Link>
              <button type="button" onClick={() => openRegistration()} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#ffb51b] px-5 text-sm font-extrabold text-[#18232a] transition hover:bg-[#ffc342]">Daftar Kelas <ArrowRight size={16} /></button>
            </div>
            <button type="button" onClick={() => setMobileOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-md border border-white/25 lg:hidden" aria-label="Buka menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
          {mobileOpen && <div className="border-t border-white/15 bg-[#0b2029] px-5 py-5 lg:hidden"><nav className="grid gap-1 text-sm font-bold">{['program', 'keunggulan', 'orang-tua', 'testimoni'].map((item) => <a key={item} href={`#${item}`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 capitalize text-white/85 hover:bg-white/10">{item.replace('-', ' ')}</a>)}<Link href="/login" className="mt-2 rounded-md border border-white/25 px-3 py-3 text-center">Masuk Admin</Link><button type="button" onClick={() => { setMobileOpen(false); openRegistration(); }} className="mt-1 rounded-md bg-[#ffb51b] px-3 py-3 font-extrabold text-slate-950">Daftar Kelas</button></nav></div>}
        </header>

        <div className="relative z-10 mx-auto flex h-[calc(100%-80px)] max-w-[1180px] items-center px-5 pb-12 lg:px-8">
          <div className="max-w-[760px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-200/25 bg-cyan-100/10 px-3 py-2 text-xs font-extrabold text-cyan-100"><Sparkles size={15} /> Learning center untuk tumbuh dengan percaya diri</div>
            <h1 className="max-w-[720px] text-[44px] font-black leading-[1.06] sm:text-[56px] lg:text-[68px]"><SplitText text="Belajar lebih terarah, progres lebih terlihat." /></h1>
            <p className="mt-6 max-w-[620px] text-base leading-7 text-white/80 sm:text-lg">Program Calistung, Bimbel, dan English dengan guru terpilih, jadwal teratur, serta laporan yang membuat orang tua selalu tahu perkembangan anak.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => openRegistration()} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#ffb51b] px-6 text-sm font-extrabold text-[#17232d] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#ffc33d]">Konsultasi & Daftar <ArrowRight size={17} /></button>
              <a href="#program" className="inline-flex h-12 items-center justify-center rounded-md border border-white/35 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950">Lihat Program Belajar</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/75"><span className="inline-flex items-center gap-2"><Check size={17} className="text-[#ffbf2d]" /> Konsultasi awal gratis</span><span className="inline-flex items-center gap-2"><Check size={17} className="text-[#ffbf2d]" /> Jadwal fleksibel</span><span className="inline-flex items-center gap-2"><Check size={17} className="text-[#ffbf2d]" /> Progress report</span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white"><div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-x divide-slate-200 px-5 py-6 lg:grid-cols-4 lg:px-8">{[[20, '+', 'Murid berkembang'], [7, '', 'Program pilihan'], [7, '', 'Guru aktif'], [65, '+', 'Sesi per minggu']].map(([value, suffix, label]) => <div key={String(label)} className="px-4 py-3 text-center"><div className="text-2xl font-black text-[#087f9b]"><CountUp value={Number(value)} suffix={String(suffix)} /></div><div className="mt-1 text-xs font-bold text-slate-500">{label}</div></div>)}</div></section>

      <section id="program" className="scroll-mt-20 bg-[#f7fafb] py-20 sm:py-24">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <ScrollReveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-[650px]"><p className="text-xs font-extrabold uppercase text-[#087f9b]">Program EdGLO</p><h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">Pilihan belajar sesuai tahap tumbuh anak</h2><p className="mt-4 text-base leading-7 text-slate-600">Mulai dari fondasi membaca hingga pendampingan pelajaran dan Bahasa Inggris intensif.</p></div><div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 md:w-auto" role="tablist" aria-label="Filter program">{['Semua', 'Calistung', 'Bimbel', 'English'].map((item) => <button type="button" role="tab" aria-selected={filter === item} key={item} onClick={() => setFilter(item)} className={`h-10 whitespace-nowrap rounded-md px-4 text-sm font-bold transition ${filter === item ? 'bg-[#087f9b] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item}</button>)}</div></ScrollReveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visiblePrograms.map((program, index) => {
              const ProgramIcon = program.group === 'English' ? Languages : program.group === 'Bimbel' ? BookOpenCheck : GraduationCap;
              return <ScrollReveal key={program.id} delay={Math.min(index * 0.04, 0.16)}><SpotlightCard className="flex min-h-[360px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-md text-white" style={{ backgroundColor: program.accent }}><ProgramIcon size={22} /></div><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{program.ages}</span></div><p className="mt-6 text-xs font-extrabold uppercase" style={{ color: program.accent }}>{program.group}</p><h3 className="mt-2 text-xl font-black text-slate-950">{program.name}</h3><p className="mt-3 min-h-[66px] text-sm leading-6 text-slate-600">{program.description}</p><ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">{program.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={13} /></span>{benefit}</li>)}</ul><div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-200 pt-5"><div><div className="text-lg font-black text-slate-950">{formatPrice(program.price)}</div><div className="text-xs font-semibold text-slate-500">per bulan</div></div><button type="button" onClick={() => openRegistration(program.id)} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-[#087f9b]">Pilih <ArrowRight size={15} /></button></div></SpotlightCard></ScrollReveal>;
            })}
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">Biaya pendaftaran dan buku dapat menyesuaikan program. Rincian lengkap diberikan saat konsultasi.</p>
        </div>
      </section>

      <section id="keunggulan" className="scroll-mt-20 bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"><ScrollReveal className="relative min-h-[520px] overflow-hidden rounded-lg bg-[#102934]"><Image src="/edglo-students.jpg" alt="Anak bereksplorasi melalui aktivitas kreatif" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /><div className="absolute inset-x-5 bottom-5 rounded-lg bg-white p-5 shadow-xl sm:left-auto sm:max-w-[280px]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-amber-100 text-amber-700"><Target size={20} /></div><div><div className="text-sm font-black text-slate-950">Target yang jelas</div><div className="text-xs text-slate-500">Disesuaikan per anak</div></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[78%] rounded-full bg-[#087f9b]" /></div></div></ScrollReveal><div><ScrollReveal><p className="text-xs font-extrabold uppercase text-[#087f9b]">Belajar yang terasa bedanya</p><h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">Bukan sekadar datang, duduk, lalu pulang</h2><p className="mt-4 max-w-[620px] text-base leading-7 text-slate-600">Setiap sesi punya tujuan, aktivitas, dan catatan agar perkembangan anak dapat dilihat dari waktu ke waktu.</p></ScrollReveal><div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">{benefits.map(({ icon: Icon, title, description }) => <ScrollReveal key={title}><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-[#087f9b]"><Icon size={20} /></div><div><h3 className="text-base font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div></div></ScrollReveal>)}</div></div></div></section>

      <section id="orang-tua" className="scroll-mt-20 bg-[#0d222c] py-20 text-white sm:py-24"><div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:px-8"><ScrollReveal><p className="text-xs font-extrabold uppercase text-cyan-300">Kontrol orang tua</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Tetap dekat dengan proses belajar, bahkan dari rumah</h2><p className="mt-5 text-base leading-7 text-white/70">Satu portal untuk melihat jadwal, kehadiran, catatan perkembangan, dan status pembayaran anak.</p><div className="mt-8 grid gap-4">{parentFeatures.map(({ icon: Icon, title, description }) => <div key={title} className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/10 text-[#ffbf2d]"><Icon size={20} /></div><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-white/60">{description}</p></div></div>)}</div><button type="button" onClick={() => openRegistration()} className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:bg-[#ffbf2d]">Daftar & aktifkan portal <ArrowRight size={16} /></button></ScrollReveal><ScrollReveal className="overflow-hidden rounded-lg border border-white/15 bg-[#132f3b] shadow-2xl shadow-black/30"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><div className="text-sm font-black">Portal Orang Tua</div><div className="mt-1 text-xs text-white/50">Selasa, 2 September 2026</div></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#ffbf2d] text-sm font-black text-slate-950">A</div></div><div className="grid gap-4 p-5 sm:grid-cols-3"><div className="rounded-lg bg-white p-4 text-slate-950 sm:col-span-2"><div className="flex items-center justify-between"><div><div className="text-xs font-bold text-slate-500">Anak</div><div className="mt-1 text-lg font-black">Aisyah Nur Fadillah</div></div><span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Aktif</span></div><div className="mt-5 rounded-lg bg-slate-50 p-4"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Target bulan ini</span><span className="text-[#087f9b]">78%</span></div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-full w-[78%] rounded-full bg-[#087f9b]" /></div><p className="mt-3 text-sm font-semibold text-slate-700">Membaca kalimat sederhana dengan lebih lancar.</p></div></div><div className="rounded-lg bg-[#ffbf2d] p-4 text-slate-950"><CalendarDays size={22} /><div className="mt-7 text-xs font-bold">Kelas berikutnya</div><div className="mt-1 text-lg font-black">Rabu</div><div className="text-sm font-bold">15.00 WIB</div></div></div><div className="grid gap-px bg-white/10 sm:grid-cols-3">{[{ icon: BarChart3, label: 'Perkembangan', value: 'Naik 12%' }, { icon: UsersRound, label: 'Kehadiran', value: '11 dari 12' }, { icon: TrendingUp, label: 'Pembayaran', value: 'Lunas' }].map(({ icon: Icon, label, value }) => <div key={label} className="bg-[#132f3b] p-5"><Icon size={18} className="text-cyan-300" /><div className="mt-4 text-xs text-white/50">{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>)}</div></ScrollReveal></div></section>

      <section className="bg-white py-20 sm:py-24"><div className="mx-auto max-w-[1180px] px-5 lg:px-8"><ScrollReveal className="mx-auto max-w-[680px] text-center"><p className="text-xs font-extrabold uppercase text-[#087f9b]">Mulai dalam tiga langkah</p><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Dari konsultasi sampai kelas pertama</h2></ScrollReveal><div className="mt-12 grid gap-8 md:grid-cols-3">{[['01', 'Ceritakan kebutuhan anak', 'Isi formulir singkat agar tim memahami usia, program, dan waktu belajar yang diinginkan.'], ['02', 'Pilih program & jadwal', 'Konsultasikan program, guru, biaya, serta slot kelas yang masih tersedia.'], ['03', 'Mulai belajar', 'Akun orang tua diaktifkan dan jadwal pertama siap dipantau dari portal.']].map(([number, title, description]) => <ScrollReveal key={number}><div className="border-t-2 border-slate-950 pt-5"><div className="text-sm font-black text-[#087f9b]">{number}</div><h3 className="mt-7 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></div></ScrollReveal>)}</div></div></section>

      <section id="testimoni" className="scroll-mt-20 bg-[#eef7f8] py-20 sm:py-24"><div className="mx-auto max-w-[1180px] px-5 lg:px-8"><ScrollReveal><p className="text-xs font-extrabold uppercase text-[#087f9b]">Cerita orang tua</p><h2 className="mt-3 max-w-[620px] text-3xl font-black text-slate-950 sm:text-4xl">Perkembangan kecil yang berarti besar</h2></ScrollReveal><div className="mt-10 grid gap-4 md:grid-cols-3">{testimonials.map((testimonial, index) => <ScrollReveal key={testimonial.name} delay={index * 0.06}><article className="flex min-h-[250px] flex-col rounded-lg border border-cyan-100 bg-white p-6"><div className="flex gap-1 text-[#f3ad18]">{Array.from({ length: 5 }).map((_, star) => <Star key={star} size={16} fill="currentColor" />)}</div><blockquote className="mt-6 text-lg font-bold leading-8 text-slate-800">“{testimonial.quote}”</blockquote><div className="mt-auto border-t border-slate-200 pt-5"><div className="text-sm font-black text-slate-950">{testimonial.name}</div><div className="mt-1 text-xs text-slate-500">{testimonial.role}</div></div></article></ScrollReveal>)}</div></div></section>

      <section className="bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-[1000px] gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:px-8"><ScrollReveal><p className="text-xs font-extrabold uppercase text-[#087f9b]">Pertanyaan umum</p><h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">Sebelum memulai kelas</h2><p className="mt-4 text-sm leading-6 text-slate-600">Masih ada yang ingin ditanyakan? Isi formulir konsultasi dan tim EdGLO akan membantu.</p></ScrollReveal><div className="divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-black text-slate-950" aria-expanded={openFaq === index}>{question}<ChevronDown size={18} className={`shrink-0 transition ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="pb-5 pr-8 text-sm leading-6 text-slate-600">{answer}</p>}</div>)}</div></div></section>

      <section className="bg-[#087f9b] py-16 text-white"><div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-7 px-5 lg:flex-row lg:items-center lg:px-8"><div><p className="text-sm font-bold text-cyan-100">Siap menemukan kelas yang tepat?</p><h2 className="mt-2 max-w-[720px] text-3xl font-black leading-tight sm:text-4xl">Mulai dari konsultasi singkat bersama tim EdGLO.</h2></div><button type="button" onClick={() => openRegistration()} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-[#ffbf2d] px-6 text-sm font-extrabold text-slate-950 transition hover:bg-white">Daftar Sekarang <ArrowRight size={17} /></button></div></section>

      <footer className="bg-[#081820] py-12 text-white"><div className="mx-auto grid max-w-[1180px] gap-10 px-5 md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8"><div><div className="inline-flex rounded-md bg-white px-3 py-2"><Image src="/edglo-logo.png" alt="EdGLO" width={454} height={244} className="h-auto w-[132px]" /></div><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">Learning center yang membantu anak belajar terarah dan membuat orang tua tetap dekat dengan prosesnya.</p></div><div><div className="text-sm font-black">Jelajahi</div><div className="mt-4 grid gap-3 text-sm text-white/60"><a href="#program" className="hover:text-white">Program</a><a href="#keunggulan" className="hover:text-white">Keunggulan</a><a href="#orang-tua" className="hover:text-white">Portal Orang Tua</a></div></div><div><div className="text-sm font-black">Akses</div><div className="mt-4 grid gap-3 text-sm text-white/60"><Link href="/login" className="hover:text-white">Login Admin</Link><button type="button" onClick={() => openRegistration()} className="text-left hover:text-white">Daftar Kursus</button></div></div></div><div className="mx-auto mt-10 flex max-w-[1180px] flex-col gap-2 border-t border-white/10 px-5 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between lg:px-8"><span>© 2026 EdGLO Learning Center.</span><span>Learn · Do · Repeat</span></div></footer>

      <CourseRegistration key={`${selectedProgram}-${registrationOpen}`} open={registrationOpen} programs={programs} initialProgram={selectedProgram} onClose={() => setRegistrationOpen(false)} />
    </main>
  );
}
