'use client';

import Image from 'next/image';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import SessionLoading from '../../components/auth/SessionLoading';
import { api } from '../../lib/api';
import { getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from '../../lib/authSession';
import LoginForm from './components/LoginForm';

export default function Login() {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const authSession = authSnapshot === null ? null : parseAuthSession(authSnapshot);
  useEffect(() => {
    if (authSnapshot !== null && authSession && authSession.user.role !== 'parent') router.replace('/dashboard');
  }, [authSnapshot, authSession, router]);

  const handleLogin = async (email: string, password: string) => {
    const response = await api.loginAdmin(email, password);
    if (!['super_admin', 'admin'].includes(response.user.role)) {
      await api.logout(response.token).catch(() => undefined);
      throw new Error('Akun ini tidak memiliki akses ke Portal Admin.');
    }
    writeAuthSession({ token: response.token, user: response.user });
    router.replace('/dashboard');
  };

  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('edglo-theme', nextTheme);
  };

  if (authSnapshot === null || (authSession && authSession.user.role !== 'parent')) {
    return <SessionLoading message={authSession ? 'Membuka dashboard...' : 'Memulihkan sesi...'} />;
  }

  return (
    <div className="login-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF7F8 0%, #E0EFFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <button type="button" className="login-theme-toggle" onClick={toggleTheme} aria-label="Ganti tema putih atau hitam" title="Ganti tema">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
      </button>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority style={{ width: 300, height: 150, objectFit: 'cover', objectPosition: 'center 44%', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: '#6B7C8D', fontWeight: 700, marginTop: 2 }}>Admin Panel - Sistem Manajemen Lembaga</div>
        </div>
        <div className="card login-panel" style={{ boxShadow: '0 8px 32px rgba(31,41,51,0.10)' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: '#1F2933', margin: '0 0 4px' }}>Masuk ke Dashboard</h1>
          <div style={{ fontSize: 13, color: '#6B7C8D', marginBottom: 24 }}>Gunakan akun admin yang terdaftar di backend EdGLO</div>
          <LoginForm onSubmit={handleLogin} emailPlaceholder="admin@edglo.id" />
        </div>
      </div>
    </div>
  );
}
