'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import LoginForm from '../../login/components/LoginForm';
import SessionLoading from '../../../components/auth/SessionLoading';
import { api } from '../../../lib/api';
import { getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from '../../../lib/authSession';

export default function ParentLogin() {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const session = authSnapshot === null ? null : parseAuthSession(authSnapshot);

  useEffect(() => {
    if (authSnapshot === null || !session) return;
    if (session.user.role === 'parent') router.replace('/parent');
  }, [authSnapshot, router, session]);

  const handleLogin = async (email: string, password: string) => {
    const response = await api.loginParent(email, password);
    if (response.user.role !== 'parent') {
      await api.logout(response.token).catch(() => undefined);
      throw new Error('Akun ini tidak memiliki akses ke Portal Orang Tua.');
    }
    writeAuthSession({ token: response.token, user: response.user });
    router.replace('/parent');
  };

  if (authSnapshot === null || session?.user.role === 'parent') return <SessionLoading message="Memulihkan portal..." />;

  return (
    <main className="parent-login-page grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="parent-login-panel flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#087f9b]"><ArrowLeft size={17} />Kembali ke beranda</Link>
          <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} className="mt-8 h-[120px] w-[250px] object-cover object-[center_44%]" priority />
          <p className="mt-5 text-xs font-extrabold uppercase text-[#087f9b]">Portal Orang Tua</p>
          <h1 className="parent-login-title mt-2 text-3xl font-extrabold tracking-normal text-slate-950">Pantau proses belajar anak</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Masuk dengan email dan password yang dibuat saat mengirim pendaftaran kelas.</p>
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5"><LoginForm onSubmit={handleLogin} emailPlaceholder="email orang tua" submitLabel="Masuk ke Portal" /></div>
          <p className="mt-5 text-center text-sm text-slate-500">Belum punya akun? <Link href="/#program" className="font-bold text-[#087f9b]">Pilih program dan daftar</Link></p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#087f9b] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
        <div className="relative z-10"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-bold"><ShieldCheck size={16} />Akses keluarga terlindungi</span></div>
        <div className="relative z-10 max-w-xl"><h2 className="text-5xl font-extrabold leading-[1.08]">Jadwal, tagihan, dan status pendaftaran tetap jelas.</h2><p className="mt-6 max-w-lg text-base leading-7 text-cyan-50">Tidak perlu mencari informasi dari banyak percakapan. Semua pembaruan penting tersimpan di portal keluarga EdGLO.</p></div>
        <div className="relative z-10 text-xs font-bold text-cyan-100">EdGLO Learning Center · Learn Do Repeat</div>
      </section>
    </main>
  );
}
