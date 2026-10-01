'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircleMore,
  ShieldCheck,
  Star,
  Target,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { PROGRAMS } from '../../data/mockData';
import CourseRegistration from './PublicCourseRegistration';
import { CountUp, ScrollReveal } from './ReactBits';

type IconType = ComponentType<{ size?: number; className?: string }>;

const programDetails: Record<string, { group: string; ages: string; description: string; accent: string; benefits: string[] }> = {
  'pra-calistung-regular': { group: 'Calistung', ages: 'Usia 4-6 tahun', description: 'Fondasi membaca, menulis, dan berhitung melalui aktivitas yang ringan dan menyenangkan.', accent: '#f7b51b', benefits: ['Materi pra-sekolah', 'Kelas kelompok kecil', 'Evaluasi perkembangan'] },
  'calistung-regular': { group: 'Calistung', ages: 'Usia 5-8 tahun', description: 'Latihan calistung terstruktur untuk membangun ketepatan, kemandirian, dan rasa percaya diri.', accent: '#22b8d6', benefits: ['3 sesi per minggu', 'Latihan bertahap', 'Laporan ke orang tua'] },
  'calistung-everyday': { group: 'Calistung', ages: 'Usia 5-8 tahun', description: 'Pendampingan intensif lima hari agar kebiasaan dan progres belajar anak tetap konsisten.', accent: '#ee6179', benefits: ['5 sesi per minggu', 'Pendampingan intensif', 'Target belajar personal'] },
  'bimbel-regular': { group: 'Bimbel', ages: 'SD kelas 1-6', description: 'Pendampingan tugas sekolah sekaligus penguatan konsep pada pelajaran utama.', accent: '#8f7df1', benefits: ['3 sesi per minggu', 'Bantuan tugas sekolah', 'Persiapan ulangan'] },
  'bimbel-everyday': { group: 'Bimbel', ages: 'SD kelas 1-6', description: 'Belajar rutin setiap hari sekolah agar materi dipahami tanpa menumpuk.', accent: '#25bd88', benefits: ['5 sesi per minggu', 'Jadwal belajar rutin', 'Review materi harian'] },
  'english-regular': { group: 'English', ages: 'Usia 6-12 tahun', description: 'Bahasa Inggris praktis dengan fokus vocabulary, speaking, dan confidence.', accent: '#5d96f5', benefits: ['3 sesi per minggu', 'Speaking practice', 'Aktivitas interaktif'] },
  'english-everyday': { group: 'English', ages: 'Usia 6-12 tahun', description: 'Paparan Bahasa Inggris lebih sering untuk membangun kebiasaan berbahasa.', accent: '#f28042', benefits: ['5 sesi per minggu', 'Daily conversation', 'Progress challenge'] },
};

const benefits: { icon: IconType; title: string; description: string }[] = [
  { icon: UserRoundCheck, title: 'Guru yang sesuai', description: 'Penempatan guru mempertimbangkan program dan kebutuhan belajar anak.' },
  { icon: Target, title: 'Target personal', description: 'Fokus belajar dibuat spesifik, bertahap, dan mudah dievaluasi.' },
  { icon: CalendarDays, title: 'Jadwal teratur', description: 'Orang tua mengetahui hari, jam, dan guru yang bertugas.' },
  { icon: MessageCircleMore, title: 'Komunikasi terbuka', description: 'Catatan penting dapat ditindaklanjuti bersama orang tua.' },
];

const registrationSteps: { icon: IconType; title: string; description: string }[] = [
  { icon: UserRoundCheck, title: 'Isi data calon murid', description: 'Orang tua mengisi data anak, kontak WhatsApp, program, durasi paket, dan waktu yang tersedia.' },
  { icon: Check, title: 'Admin memeriksa data', description: 'Pendaftaran masuk ke antrean Admin untuk diverifikasi tanpa membuat akun orang tua.' },
  { icon: CalendarDays, title: 'Guru dan jadwal ditetapkan', description: 'Setelah disetujui, Admin menghubungi orang tua lalu menyusun kelas yang tersedia.' },
];

const testimonials = [
  { quote: 'Sekarang Aisyah lebih percaya diri membaca dan selalu menunggu jadwal belajarnya.', name: 'Wahyu Hidayat', role: 'Orang tua murid Calistung' },
  { quote: 'Proses pendaftarannya jelas dan jadwal dikonfirmasi langsung oleh Admin melalui WhatsApp.', name: 'Dewi Santoso', role: 'Orang tua murid English' },
  { quote: 'Gurunya komunikatif. Target belajar dijelaskan dengan bahasa yang mudah dipahami.', name: 'Hendra Rahayu', role: 'Orang tua murid Bimbel' },
];

const faqs = [
  ['Apakah bisa konsultasi sebelum memilih program?', 'Bisa. Tim EdGLO akan melihat usia, kebutuhan belajar, dan jadwal anak sebelum merekomendasikan program.'],
  ['Berapa jumlah pertemuan setiap minggu?', 'Program Regular memiliki 3 sesi per minggu, sedangkan program Everyday memiliki 5 sesi per minggu.'],
  ['Apakah orang tua mendapat laporan perkembangan?', 'Ya. Catatan perkembangan dan informasi kelas akan disampaikan oleh tim EdGLO melalui jalur komunikasi yang disepakati.'],
  ['Apakah jadwal belajar dapat dipilih?', 'Pilihan jadwal dibicarakan saat konsultasi dan disesuaikan dengan kelas serta guru yang tersedia.'],
];

const learningSpaces = [
  { image: '/edglo-classroom.jpg', title: 'Kelas terarah', label: 'Kelompok kecil', position: 'center' },
  { image: '/edglo-students.jpg', title: 'Eksplorasi kreatif', label: 'Belajar aktif', position: 'center 36%' },
  { image: '/edglo-classroom.jpg', title: 'Pendampingan dekat', label: 'Guru pilihan', position: 'left center' },
  { image: '/edglo-students.jpg', title: 'Ruang bertumbuh', label: 'Percaya diri', position: 'center 58%' },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function PremiumLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const programs = useMemo(() => PROGRAMS.map((program) => ({
    id: program.id,
    name: program.name,
    price: program.price,
    sessions: program.sessionsPerWeek,
    ...programDetails[program.id],
  })), []);
  const activeProgram = programs[activeProgramIndex];

  const openRegistration = (programId = '') => {
    setSelectedProgram(programId);
    setRegistrationOpen(true);
  };

  const moveProgram = (direction: number) => {
    setActiveProgramIndex((current) => (current + direction + programs.length) % programs.length);
  };

  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-white text-slate-950">
      <section className="landing-hero relative min-h-[720px] overflow-hidden">
        <Image src="/edglo-classroom.jpg" alt="Kegiatan belajar bersama di EdGLO" fill priority sizes="100vw" className="object-cover object-[65%_center]" />
        <div className="absolute inset-0 bg-white/88" />

        <header className="absolute inset-x-0 top-0 z-30 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-[1160px] items-center justify-between px-5 lg:px-8">
            <Link href="/" aria-label="Beranda EdGLO" className="landing-brand inline-flex h-[60px] w-[150px] items-center overflow-hidden">
              <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} className="landing-brand-logo" priority />
            </Link>
            <nav className="hidden items-center gap-7 text-[13px] font-bold text-slate-600 lg:flex" aria-label="Navigasi utama">
              <a href="#program" className="transition hover:text-[#087f9b]">Program</a>
              <a href="#pengalaman" className="transition hover:text-[#087f9b]">Cara Belajar</a>
              <a href="#fasilitas" className="transition hover:text-[#087f9b]">Suasana Kelas</a>
              <a href="#pendaftaran" className="transition hover:text-[#087f9b]">Pendaftaran</a>
            </nav>
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"><ShieldCheck size={16} />Masuk Admin</Link>
              <button type="button" onClick={() => openRegistration()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2ab9df] px-5 text-sm font-extrabold text-[#041018] transition hover:bg-[#f7b51b]">Daftar Kelas <ArrowRight size={16} /></button>
            </div>
            <button type="button" onClick={() => setMobileOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-700 lg:hidden" aria-label="Buka menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
          {mobileOpen && (
            <div className="mx-auto mt-2 max-w-[1160px] rounded-md border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl lg:hidden">
              <nav className="grid gap-1 text-sm font-bold">
                {[['program', 'Program'], ['pengalaman', 'Cara Belajar'], ['fasilitas', 'Suasana Kelas'], ['pendaftaran', 'Pendaftaran']].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-slate-700 hover:bg-slate-100 hover:text-slate-950">{label}</a>)}
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-md border border-slate-300 px-3 py-3"><ShieldCheck size={18} className="text-[#087f9b]" />Masuk Admin</Link>
                <button type="button" onClick={() => { setMobileOpen(false); openRegistration(); }} className="rounded-md bg-[#2ab9df] px-3 py-3 font-extrabold text-[#041018]">Daftar Kelas</button>
              </nav>
            </div>
          )}
        </header>

        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1160px] items-center px-5 pb-28 pt-28 lg:px-8">
          <div className="max-w-[700px]">
            <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase text-[#087f9b]"><span className="h-px w-10 bg-[#087f9b]" /> Learning center di Batam</div>
            <h1 className="text-[46px] font-bold leading-[1.08] text-slate-950 sm:text-[60px] lg:text-[68px]">EdGLO Learning Center</h1>
            <p className="mt-6 max-w-[640px] text-base leading-7 text-slate-600 sm:text-lg">Pendampingan Calistung, Bimbel, dan English dengan tujuan belajar yang jelas, jadwal teratur, serta laporan perkembangan untuk orang tua.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => openRegistration()} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2ab9df] px-7 text-sm font-extrabold text-[#041018] shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-[#f7b51b]">Konsultasi & Daftar <ArrowRight size={17} /></button>
              <a href="#program" className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white/80 px-7 text-sm font-bold text-slate-800 backdrop-blur-sm transition hover:border-slate-950 hover:bg-slate-950 hover:text-white">Jelajahi Program</a>
            </div>
          </div>
        </div>

        <div className="landing-ribbons absolute inset-x-0 bottom-0 z-20 h-[88px] bg-white" aria-hidden="true">
          <div className="landing-ribbon landing-ribbon-up"><div className="landing-marquee landing-marquee-reverse">{Array.from({ length: 2 }).map((_, group) => <div key={group} className="landing-marquee-set"><span>Calistung</span><i /> <span>Bimbel</span><i /> <span>English</span><i /> <span>Progress Report</span><i /> <span>Jadwal Fleksibel</span><i /></div>)}</div></div>
          <div className="landing-ribbon landing-ribbon-down"><div className="landing-marquee">{Array.from({ length: 2 }).map((_, group) => <div key={group} className="landing-marquee-set"><span>Learn</span><i /> <span>Do</span><i /> <span>Repeat</span><i /> <span>Tumbuh Percaya Diri</span><i /> <span>Belajar Terarah</span><i /></div>)}</div></div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 px-5 py-5 lg:grid-cols-4 lg:px-8">
          {[[20, '+', 'Murid berkembang'], [7, '', 'Program pilihan'], [7, '', 'Guru aktif'], [65, '+', 'Sesi per minggu']].map(([value, suffix, label]) => <div key={String(label)} className="px-3 py-4 text-center"><div className="text-3xl font-black text-[#087f9b]"><CountUp value={Number(value)} suffix={String(suffix)} /></div><div className="mt-1 text-xs font-bold text-slate-500">{label}</div></div>)}
        </div>
      </section>

      <section id="program" className="scroll-mt-24 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1160px] px-5 lg:px-8">
          <ScrollReveal className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="max-w-[720px]"><p className="text-xs font-extrabold uppercase text-[#087f9b]">Program belajar</p><h2 className="mt-3 text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl">Temukan ritme belajar yang paling pas.</h2></div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => moveProgram(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-950 hover:text-slate-950" aria-label="Program sebelumnya"><ChevronLeft size={19} /></button><span className="min-w-14 text-center text-xs font-bold text-slate-500">{String(activeProgramIndex + 1).padStart(2, '0')} / {String(programs.length).padStart(2, '0')}</span><button type="button" onClick={() => moveProgram(1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-950 hover:text-slate-950" aria-label="Program berikutnya"><ChevronRight size={19} /></button></div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <ScrollReveal className="grid content-start gap-2">
              {programs.map((program, index) => (
                <button key={program.id} type="button" onClick={() => setActiveProgramIndex(index)} className={`group flex min-h-16 items-center gap-4 rounded-md border px-4 text-left shadow-sm transition ${activeProgramIndex === index ? 'border-[#20a9ca] bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                  <span className={`text-xs font-black ${activeProgramIndex === index ? 'text-[#087f9b]' : 'text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-sm font-extrabold text-slate-900">{program.name}</span><ArrowRight size={16} className={`transition ${activeProgramIndex === index ? 'text-[#087f9b]' : 'text-slate-300 group-hover:text-slate-600'}`} />
                </button>
              ))}
            </ScrollReveal>

            <ScrollReveal>
              <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-6 sm:p-9">
                <div className="absolute right-0 top-0 h-1 w-1/3" style={{ backgroundColor: activeProgram.accent }} />
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">{activeProgram.ages}</span><span className="text-xs font-black uppercase" style={{ color: activeProgram.accent }}>{activeProgram.group}</span></div>
                <div className="mt-16 max-w-[650px]"><h3 className="text-4xl font-black leading-none text-slate-950 sm:text-6xl">{activeProgram.name}</h3><p className="mt-6 max-w-[560px] text-base leading-7 text-slate-600">{activeProgram.description}</p></div>
                <div className="mt-10 grid gap-3 sm:grid-cols-3">{activeProgram.benefits.map((benefit) => <div key={benefit} className="flex items-center gap-2 border-t border-slate-200 pt-4 text-sm font-bold text-slate-700"><Check size={16} style={{ color: activeProgram.accent }} />{benefit}</div>)}</div>
                <div className="mt-auto flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-7 sm:flex-row sm:items-end"><div><div className="text-3xl font-black text-slate-950">{formatPrice(activeProgram.price)}</div><div className="mt-1 text-xs font-semibold text-slate-500">per bulan · {activeProgram.sessions} sesi per minggu</div></div><button type="button" onClick={() => openRegistration(activeProgram.id)} className="inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-extrabold text-[#041018] transition hover:-translate-y-0.5" style={{ backgroundColor: activeProgram.accent }}>Pilih Program <ArrowRight size={17} /></button></div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section id="pengalaman" className="scroll-mt-24 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1160px] px-5 lg:px-8">
          <ScrollReveal className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[560px] overflow-hidden rounded-md border border-white/15"><Image src="/edglo-students.jpg" alt="Anak menikmati kegiatan kreatif" fill loading="eager" sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover object-center" /><div className="absolute inset-0 bg-[#07101b]/15" /><div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-md border border-white/20 bg-[#06101a]/85 p-5 text-white backdrop-blur-md"><div><p className="text-xs font-bold text-white/45">Setiap anak punya ritme</p><p className="mt-1 text-lg font-black">Target belajar yang personal</p></div><div className="grid h-11 w-11 place-items-center rounded-full bg-[#f7b51b] text-[#07101b]"><Target size={21} /></div></div></div>
            <div><p className="text-xs font-extrabold uppercase text-[#087f9b]">Cara belajar EdGLO</p><h2 className="mt-3 text-4xl font-black leading-[1.08] text-slate-950 sm:text-5xl">Bukan sekadar datang, duduk, lalu pulang.</h2><p className="mt-6 text-base leading-7 text-slate-600">Setiap pertemuan memiliki tujuan, aktivitas, dan catatan yang membuat perkembangan anak terlihat dari waktu ke waktu.</p><div className="mt-10 grid gap-7 sm:grid-cols-2">{benefits.map(({ icon: Icon, title, description }) => <div key={title} className="border-t border-slate-200 pt-5"><Icon size={21} className="text-[#e5a20e]" /><h3 className="mt-5 text-base font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>)}</div></div>
          </ScrollReveal>
        </div>
      </section>

      <section id="fasilitas" className="scroll-mt-24 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1160px] px-5 lg:px-8">
          <ScrollReveal className="mx-auto max-w-[760px] text-center"><p className="text-xs font-extrabold uppercase text-[#087f9b]">Suasana belajar</p><h2 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">Ruang aman untuk mencoba dan bertumbuh.</h2><p className="mt-5 text-base leading-7 text-slate-600">Kelas dirancang untuk interaksi yang dekat, fokus, dan tetap menyenangkan bagi anak.</p></ScrollReveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2">{learningSpaces.map((space, index) => <ScrollReveal key={space.title} delay={index * 0.05}><figure className="group relative aspect-[16/9] overflow-hidden rounded-md border border-white/15"><Image src={space.image} alt={space.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: space.position }} /><div className="absolute inset-0 bg-[#020710]/25" /><figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4"><div><span className="inline-flex rounded-full bg-[#2ab9df] px-3 py-1 text-[11px] font-black text-[#041018]">{space.label}</span><h3 className="mt-2 text-xl font-black text-white">{space.title}</h3></div><span className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-sm"><ArrowRight size={17} /></span></figcaption></figure></ScrollReveal>)}</div>
        </div>
      </section>

      <section id="pendaftaran" className="scroll-mt-24 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1160px] px-5 lg:px-8">
          <ScrollReveal className="max-w-[760px]"><p className="text-xs font-extrabold uppercase text-[#087f9b]">Pendaftaran murid</p><h2 className="mt-3 text-4xl font-black leading-[1.08] text-slate-950 sm:text-5xl">Daftar singkat, lalu Admin membantu menyiapkan kelas.</h2><p className="mt-6 text-base leading-7 text-slate-600">Formulir ini hanya mengumpulkan kebutuhan calon murid. Tidak ada akun orang tua yang dibuat. Setelah data diperiksa, Admin EdGLO akan menghubungi orang tua melalui WhatsApp.</p></ScrollReveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">{registrationSteps.map(({ icon: Icon, title, description }, index) => <ScrollReveal key={title} delay={index * 0.06}><article className="h-full border-t-2 border-slate-950 pt-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-md bg-[#f7b51b] text-[#07101b]"><Icon size={21} /></span><span className="text-sm font-black text-slate-300">0{index + 1}</span></div><h3 className="mt-7 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></article></ScrollReveal>)}</div>
          <ScrollReveal className="mt-12 flex flex-col items-start justify-between gap-5 border-y border-slate-200 py-7 sm:flex-row sm:items-center"><div><p className="font-black text-slate-950">Sudah tahu program yang diminati?</p><p className="mt-1 text-sm text-slate-600">Pilih sampai tiga program dan durasi paket. Admin akan mengonfirmasi harga, promo, guru, dan jadwal final.</p></div><button type="button" onClick={() => openRegistration()} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-[#087f9b] px-6 text-sm font-extrabold text-white transition hover:bg-[#f7b51b] hover:text-[#07101b]">Isi Formulir Pendaftaran <ArrowRight size={16} /></button></ScrollReveal>
        </div>
      </section>

      <section id="testimoni" className="scroll-mt-24 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1160px] px-5 lg:px-8"><ScrollReveal><p className="text-xs font-extrabold uppercase text-[#087f9b]">Cerita orang tua</p><h2 className="mt-3 max-w-[720px] text-4xl font-black leading-[1.08] text-slate-950 sm:text-5xl">Perkembangan kecil yang berarti besar.</h2></ScrollReveal><div className="mt-12 grid gap-4 md:grid-cols-3">{testimonials.map((testimonial, index) => <ScrollReveal key={testimonial.name} delay={index * 0.06}><article className="flex min-h-[300px] flex-col rounded-md border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-1 text-[#e5a20e]">{Array.from({ length: 5 }).map((_, star) => <Star key={star} size={16} fill="currentColor" />)}</div><blockquote className="mt-8 text-lg font-bold leading-8 text-slate-800">“{testimonial.quote}”</blockquote><div className="mt-auto border-t border-slate-200 pt-5"><div className="text-sm font-black text-slate-950">{testimonial.name}</div><div className="mt-1 text-xs text-slate-500">{testimonial.role}</div></div></article></ScrollReveal>)}</div></div>
      </section>

      <section className="border-t border-slate-200 bg-white py-24 sm:py-28"><div className="mx-auto grid max-w-[1040px] gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:px-8"><ScrollReveal><p className="text-xs font-extrabold uppercase text-[#087f9b]">Pertanyaan umum</p><h2 className="mt-3 text-4xl font-black leading-tight text-slate-950">Sebelum memulai kelas.</h2><p className="mt-5 text-sm leading-6 text-slate-600">Masih ada yang ingin ditanyakan? Isi formulir konsultasi dan tim EdGLO akan membantu.</p></ScrollReveal><div className="divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-6 text-left text-sm font-black text-slate-950" aria-expanded={openFaq === index}>{question}<ChevronDown size={18} className={`shrink-0 transition ${openFaq === index ? 'rotate-180 text-[#087f9b]' : 'text-slate-400'}`} /></button>{openFaq === index && <p className="pb-6 pr-8 text-sm leading-6 text-slate-600">{answer}</p>}</div>)}</div></div></section>

      <section className="border-y border-slate-200 bg-white py-20 text-slate-950"><div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-8 px-5 lg:flex-row lg:items-center lg:px-8"><div><p className="text-sm font-bold text-[#087f9b]">Siap menemukan kelas yang tepat?</p><h2 className="mt-2 max-w-[760px] text-4xl font-black leading-[1.05] sm:text-5xl">Mulai dari konsultasi singkat bersama tim EdGLO.</h2></div><button type="button" onClick={() => openRegistration()} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-[#087f9b] px-7 text-sm font-extrabold text-white transition hover:bg-[#f7b51b] hover:text-[#07101b]">Daftar Sekarang <ArrowRight size={17} /></button></div></section>

      <footer className="border-t border-slate-200 bg-white py-12 text-slate-950"><div className="mx-auto grid max-w-[1160px] gap-10 px-5 md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8"><div><div className="landing-footer-brand h-[74px] w-[164px] overflow-hidden"><Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} className="landing-footer-logo" /></div><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Learning center yang membantu anak belajar terarah dan membuat orang tua tetap dekat dengan prosesnya.</p></div><div><div className="text-sm font-black">Jelajahi</div><div className="mt-4 grid gap-3 text-sm text-slate-500"><a href="#program" className="hover:text-[#087f9b]">Program</a><a href="#pengalaman" className="hover:text-[#087f9b]">Cara Belajar</a><a href="#fasilitas" className="hover:text-[#087f9b]">Suasana Kelas</a></div></div><div><div className="text-sm font-black">Akses</div><div className="mt-4 grid gap-3 text-sm text-slate-500"><button type="button" onClick={() => openRegistration()} className="text-left hover:text-[#087f9b]">Daftar Kursus</button><Link href="/login" className="hover:text-[#087f9b]">Login Admin</Link></div></div></div><div className="mx-auto mt-10 flex max-w-[1160px] flex-col gap-2 border-t border-slate-200 px-5 pt-6 text-xs text-slate-400 sm:flex-row sm:justify-between lg:px-8"><span>© 2026 EdGLO Learning Center.</span><span>Learn · Do · Repeat</span></div></footer>

      <CourseRegistration key={`${selectedProgram}-${registrationOpen}`} open={registrationOpen} programs={programs} initialProgram={selectedProgram} onClose={() => setRegistrationOpen(false)} />
    </main>
  );
}
