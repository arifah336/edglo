'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Admin, AuthUser, ClassSession, Page, Payment, Program, Student, Teacher } from './types';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Teachers from './views/Teachers';
import Schedule from './views/Schedule';
import Finance from './views/Finance';
import Reports from './views/Reports';
import AdminManagement from './views/AdminManagement';
import Settings from './views/Settings';
import { ApiError, api } from './lib/api';
import { useToast } from './components/ui/ToastProvider';

const AUTH_STORAGE_KEY = 'edglo-auth';
const AUTH_CHANGE_EVENT = 'edglo-auth-change';
type AuthSession = { token: string; user: AuthUser };

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

function getAuthSnapshot() {
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? '';
}

function getServerAuthSnapshot() {
  return null;
}

function parseAuthSession(snapshot: string): AuthSession | null {
  try {
    const session = JSON.parse(snapshot) as Partial<AuthSession>;
    return session.token && session.user?.id ? session as AuthSession : null;
  } catch {
    return null;
  }
}

function writeAuthSession(session?: AuthSession) {
  if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi server.';
}

function AuthHydrationLoading() {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <Image src="/edglo-logo.png" alt="EdGLO" width={454} height={244} priority />
      <span>Memulihkan sesi...</span>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), password);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('edglo-theme', nextTheme);
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF7F8 0%, #E0EFFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <button type="button" className="login-theme-toggle" onClick={toggleTheme} aria-label="Ganti tema putih atau hitam" title="Ganti tema"><span aria-hidden="true">◐</span></button>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}><Image src="/edglo-logo.png" alt="EdGLO" width={454} height={244} priority style={{ width: 260, height: 'auto', objectFit: 'contain', margin: '0 auto 8px' }} /><div style={{ fontSize: 13, color: '#6B7C8D', fontWeight: 700, marginTop: 2 }}>Admin Panel - Sistem Manajemen Lembaga</div></div>
        <div className="card login-panel" style={{ boxShadow: '0 8px 32px rgba(31,41,51,0.10)' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: '#1F2933', marginBottom: 4 }}>Masuk ke Dashboard</div>
          <div style={{ fontSize: 13, color: '#6B7C8D', marginBottom: 24 }}>Gunakan akun admin yang terdaftar di backend EdGLO</div>
          <form suppressHydrationWarning onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label className="input-label" htmlFor="login-email">Email</label><input id="login-email" suppressHydrationWarning className="input-field" type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="superadmin@edglo.id" required /></div>
            <div><label className="input-label" htmlFor="login-password">Password</label><input id="login-password" suppressHydrationWarning className="input-field" type="password" name="password" autoCapitalize="none" autoCorrect="off" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required /></div>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 15, marginTop: 4 }}>{loading ? 'Memeriksa akun...' : 'Masuk'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BackendLoading({ error, onRetry, onLogout }: { error?: string; onRetry: () => void; onLogout: () => void }) {
  return (
    <div className="backend-loading-screen" role={error ? 'alert' : 'status'} aria-live="polite">
      <div className="backend-loading-visual">
        <span className="backend-loading-ring" aria-hidden="true" />
        <Image className="backend-loading-logo" src="/edglo-logo.png" alt="EdGLO" width={454} height={244} priority />
      </div>
      <div className="backend-loading-copy">
        <strong>{error ? 'Data belum berhasil dimuat' : 'Menyiapkan EdGLO'}</strong>
        {error && <span>{error}</span>}
      </div>
      {error && <div className="backend-loading-actions"><button type="button" className="btn-secondary" onClick={onLogout}>Keluar</button><button type="button" className="btn-primary" onClick={onRetry}>Coba Lagi</button></div>}
    </div>
  );
}

function replaceById<T extends { id: string }>(items: T[], item: T, oldId = item.id) {
  return items.map((current) => current.id === oldId ? item : current);
}

export default function App() {
  const { notify } = useToast();
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const authSession = authSnapshot === null ? null : parseAuthSession(authSnapshot);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navContext, setNavContext] = useState<{ id?: string }>({});
  const [dataReady, setDataReady] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const token = authSession?.token;
  const user = authSession?.user;

  const loadData = useCallback(async (session: AuthSession) => {
    setDataReady(false);
    setLoadingError('');
    try {
      const data = await api.bootstrap(session.token);
      writeAuthSession({ token: session.token, user: data.user });
      setPrograms(data.programs);
      setStudents(data.students);
      setTeachers(data.teachers);
      setClassSessions(data.sessions);
      setPayments(data.payments);
      setAdmins(data.admins);
      setDataReady(true);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) writeAuthSession();
      else {
        const message = errorMessage(loadError);
        setLoadingError(message);
        notify({ tone: 'error', title: 'Data belum dapat dimuat', message });
      }
    }
  }, [notify]);

  useEffect(() => {
    if (!authSession) return;
    const timer = window.setTimeout(() => void loadData(authSession), 0);
    return () => window.clearTimeout(timer);
    // Token adalah identitas stabil sesi; pembaruan profil tidak perlu memuat ulang semua data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.token, loadData]);

  const handleLogin = async (email: string, password: string) => {
    const response = await api.login(email, password);
    writeAuthSession({ token: response.token, user: response.user });
  };

  const handleLogout = async () => {
    const logoutToken = token;
    writeAuthSession();
    setDataReady(false);
    setLoadingError('');
    setStudents([]);
    setTeachers([]);
    setPrograms([]);
    setClassSessions([]);
    setPayments([]);
    setAdmins([]);
    setCurrentPage('dashboard');
    setNavContext({});
    if (logoutToken) await api.logout(logoutToken).catch(() => undefined);
  };

  const handleStudentsChange = async (next: Student[]) => {
    if (!token) return;
    const previous = students;
    setStudents(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createStudent(token, created);
        setStudents((current) => replaceById(current, saved, created.id));
      }
      else if (changed) {
        const old = previous.find((item) => item.id === changed.id)!;
        const saved = old.status !== changed.status ? await api.changeStudentStatus(token, changed) : await api.updateStudent(token, changed.id, changed);
        setStudents((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setStudents(previous);
      notify({ tone: 'error', title: 'Data murid gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleTeachersChange = async (next: Teacher[]) => {
    if (!token) return;
    const previous = teachers;
    setTeachers(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createTeacher(token, created);
        setTeachers((current) => replaceById(current, saved, created.id));
      }
      else if (changed) {
        const old = previous.find((item) => item.id === changed.id)!;
        const saved = old.status !== changed.status ? await api.changeTeacherStatus(token, changed) : await api.updateTeacher(token, changed.id, changed);
        setTeachers((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setTeachers(previous);
      notify({ tone: 'error', title: 'Data guru gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleSessionsChange = async (next: ClassSession[]) => {
    if (!token) return;
    const previous = classSessions;
    setClassSessions(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const removed = previous.find((item) => !next.some((current) => current.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (removed) await api.deleteSession(token, removed.id);
      else if (created) {
        const saved = await api.createSession(token, created);
        setClassSessions((current) => replaceById(current, saved, created.id));
      } else if (changed) {
        const saved = await api.updateSession(token, changed.id, changed);
        setClassSessions((current) => replaceById(current, saved));
      }
      setStudents(await api.students(token));
    } catch (mutationError) {
      setClassSessions(previous);
      notify({ tone: 'error', title: 'Jadwal gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handlePaymentsChange = async (next: Payment[]) => {
    if (!token) return;
    const previous = payments;
    setPayments(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createPayment(token, created);
        setPayments((current) => replaceById(current, saved, created.id));
      } else if (changed?.status === 'paid') {
        const saved = await api.markPaymentPaid(token, changed);
        setPayments((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setPayments(previous);
      notify({ tone: 'error', title: 'Tagihan gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleNavigate = (page: Page, id?: string) => {
    setCurrentPage(page);
    setNavContext({ id });
  };

  if (authSnapshot === null) return <AuthHydrationLoading />;
  if (!authSession) return <LoginPage onLogin={handleLogin} />;
  if (!dataReady) return <BackendLoading error={loadingError || undefined} onRetry={() => void loadData(authSession)} onLogout={() => void handleLogout()} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} students={students} teachers={teachers} payments={payments} programs={programs} />;
      case 'students':
      case 'student-form':
      case 'student-detail': return <Students key={currentPage + ':' + (navContext.id ?? '')} onNavigate={handleNavigate} students={students} teachers={teachers} programs={programs} onStudentsChange={handleStudentsChange} initialView={currentPage === 'student-form' ? 'form' : currentPage === 'student-detail' ? 'detail' : 'list'} viewStudentId={currentPage === 'student-detail' ? navContext.id : undefined} editStudentId={currentPage === 'student-form' ? navContext.id : undefined} />;
      case 'student-activation': return <Students key="student-activation" onNavigate={handleNavigate} students={students} teachers={teachers} programs={programs} onStudentsChange={handleStudentsChange} initialView="activation" />;
      case 'teachers':
      case 'teacher-form':
      case 'teacher-detail':
      case 'teacher-activation': return <Teachers key={currentPage + ':' + (navContext.id ?? '')} onNavigate={handleNavigate} initialView={currentPage === 'teacher-form' ? 'form' : currentPage === 'teacher-detail' ? 'detail' : currentPage === 'teacher-activation' ? 'activation' : 'list'} initialTeacherId={navContext.id} students={students} sessions={classSessions} teachers={teachers} onTeachersChange={handleTeachersChange} />;
      case 'schedule': return <Schedule students={students} teachers={teachers} programs={programs} sessions={classSessions} onSessionsChange={handleSessionsChange} />;
      case 'finance-monthly': return <Finance mode="monthly" students={students} programs={programs} payments={payments} onPaymentsChange={handlePaymentsChange} />;
      case 'finance-yearly': return <Finance mode="yearly" students={students} programs={programs} payments={payments} onPaymentsChange={handlePaymentsChange} />;
      case 'reports': return <Reports students={students} teachers={teachers} programs={programs} payments={payments} />;
      case 'admin-management': return authSession.user.role === 'super_admin' ? <AdminManagement admins={admins} token={authSession.token} onAdminsChange={setAdmins} /> : <div style={{ padding: 40, textAlign: 'center', color: '#6B7C8D' }}>Akses ditolak</div>;
      case 'settings': return <Settings user={authSession.user} token={authSession.token} onUserChange={(nextUser) => writeAuthSession({ token: authSession.token, user: nextUser })} />;
      default: return <Dashboard onNavigate={handleNavigate} students={students} teachers={teachers} payments={payments} programs={programs} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} onLogout={() => void handleLogout()} role={user?.role ?? 'admin'} adminName={user?.name ?? 'Admin EdGLO'}>
      {renderPage()}
    </Layout>
  );
}
