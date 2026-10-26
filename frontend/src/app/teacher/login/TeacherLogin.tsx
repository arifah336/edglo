'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpenCheck } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../../login/components/LoginForm';
import SessionLoading from '../../../components/auth/SessionLoading';
import { api } from '../../../lib/api';
import { getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from '../../../lib/authSession';

export default function TeacherLogin() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const session = snapshot === null ? null : parseAuthSession(snapshot);

  useEffect(() => {
    if (snapshot === null || !session) return;
    if (session.user.role === 'teacher') router.replace('/teacher');
    else if (['super_admin', 'admin'].includes(session.user.role)) router.replace('/dashboard');
  }, [router, session, snapshot]);

  const login = async (email: string, password: string) => {
    const response = await api.loginTeacher(email, password);
    if (response.user.role !== 'teacher') throw new Error('Akun ini tidak memiliki akses ke Portal Guru.');
    writeAuthSession({ token: response.token, user: response.user });
    router.replace('/teacher');
  };

  if (snapshot === null || session) return <SessionLoading message="Membuka Portal Guru..." />;

  return (
    <main className="teacher-login-page">
      <Link href="/" className="login-exit-link"><ArrowLeft size={18} /><span>Kembali ke beranda</span></Link>
      <section className="teacher-login-intro">
        <div className="teacher-login-brand"><Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority /></div>
        <span className="teacher-login-kicker"><BookOpenCheck size={17} /> PORTAL GURU</span>
        <h1>Fokus pada perkembangan anak tanggungan.</h1>
        <p>Lihat jadwal, catat aktivitas belajar, dan kumpulkan poin tanpa membuka data operasional lainnya.</p>
      </section>
      <section className="teacher-login-form-panel">
        <div><span className="eyebrow">AKSES PENGAJAR</span><h2>Masuk ke Portal Guru</h2><p>Gunakan email dan password yang diatur oleh Super Admin.</p></div>
        <LoginForm onSubmit={login} emailPlaceholder="email guru" submitLabel="Masuk sebagai Guru" />
        <Link href="/login" className="teacher-login-admin-link">Masuk sebagai Admin</Link>
      </section>
    </main>
  );
}
