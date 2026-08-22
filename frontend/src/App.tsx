'use client';

import Image from 'next/image';
import { useState, useSyncExternalStore } from 'react';
import type { ClassSession, Page, Payment, Student, UserRole } from './types';
import { PAYMENTS, STUDENTS } from './data/mockData';
import {
  applySessionsToStudents,
  createClassSessions,
  reconcileSessionsWithStudents,
} from './data/scheduleState';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Teachers from './views/Teachers';
import Schedule from './views/Schedule';
import Finance from './views/Finance';
import Reports from './views/Reports';
import AdminManagement from './views/AdminManagement';
import Settings from './views/Settings';

const AUTH_STORAGE_KEY = 'edglo-auth';
const AUTH_CHANGE_EVENT = 'edglo-auth-change';

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
  return '';
}

function writeAuthSession(role?: UserRole) {
  if (role) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ loggedIn: true, role }));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function LoginPage({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    setError('');
    if (normalizedEmail === 'superadmin@edglo.id' && normalizedPassword === 'admin123') {
      onLogin('super_admin');
    } else if (normalizedEmail === 'admin@edglo.id' && normalizedPassword === 'admin123') {
      onLogin('admin');
    } else {
      setError('Email atau password salah. Periksa kembali akun demo yang digunakan.');
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
          <div style={{ fontSize: 13, color: '#6B7C8D', marginBottom: 24 }}>Gunakan akun admin yang telah didaftarkan</div>
          <form suppressHydrationWarning onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Email</label>
              <input
                suppressHydrationWarning
                className="input-field"
                type="email"
                name="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@edglo.id"
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                suppressHydrationWarning
                className="input-field"
                type="password"
                name="password"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 15, marginTop: 4 }}>Masuk</button>
          </form>
          <div className="login-demo-box">
            <strong>Demo:</strong> superadmin@edglo.id / admin123 atau admin@edglo.id / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  let authSession: { loggedIn?: boolean; role?: UserRole } = {};
  try {
    authSession = authSnapshot ? JSON.parse(authSnapshot) as { loggedIn?: boolean; role?: UserRole } : {};
  } catch {
    authSession = {};
  }
  const loggedIn = authSession.loggedIn === true && (authSession.role === 'super_admin' || authSession.role === 'admin');
  const role: UserRole = authSession.role === 'admin' ? 'admin' : 'super_admin';
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navContext, setNavContext] = useState<{ id?: string }>({});
  const [students, setStudents] = useState<Student[]>(() =>
    STUDENTS.map((student) => ({
      ...student,
      schedules: student.schedules.map((schedule) => ({ ...schedule })),
      statusHistory: student.statusHistory.map((history) => ({ ...history })),
    })),
  );
  const [classSessions, setClassSessions] = useState<ClassSession[]>(() => createClassSessions(STUDENTS));
  const [payments, setPayments] = useState<Payment[]>(() => PAYMENTS.map((payment) => ({ ...payment })));
  const handleStudentsChange = (nextStudents: Student[]) => {
    setStudents(nextStudents);
    setClassSessions((current) => reconcileSessionsWithStudents(current, nextStudents));
  };
  const handleSessionsChange = (nextSessions: ClassSession[]) => {
    setClassSessions(nextSessions);
    setStudents((current) => applySessionsToStudents(current, nextSessions));
  };
  const handleNavigate = (page: Page, id?: string) => { setCurrentPage(page); setNavContext({ id }); };
  if (!loggedIn) return <LoginPage onLogin={writeAuthSession} />;
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'students':
      case 'student-form':
      case 'student-detail':
        return (
          <Students
            key={`${currentPage}:${navContext.id ?? ''}`}
            onNavigate={handleNavigate}
            students={students}
            onStudentsChange={handleStudentsChange}
            initialView={currentPage === 'student-form' ? 'form' : currentPage === 'student-detail' ? 'detail' : 'list'}
            viewStudentId={currentPage === 'student-detail' ? navContext.id : undefined}
            editStudentId={currentPage === 'student-form' ? navContext.id : undefined}
          />
        );
      case 'student-activation':
        return <Students key="student-activation" onNavigate={handleNavigate} students={students} onStudentsChange={handleStudentsChange} initialView="activation" />;
      case 'teachers':
      case 'teacher-form':
      case 'teacher-detail':
      case 'teacher-activation':
        return (
          <Teachers
            key={`${currentPage}:${navContext.id ?? ''}`}
            onNavigate={handleNavigate}
            initialView={
              currentPage === 'teacher-form'
                ? 'form'
                : currentPage === 'teacher-detail'
                  ? 'detail'
                  : currentPage === 'teacher-activation'
                    ? 'activation'
                    : 'list'
            }
            initialTeacherId={navContext.id}
            students={students}
            sessions={classSessions}
          />
        );
      case 'schedule': return <Schedule students={students} sessions={classSessions} onSessionsChange={handleSessionsChange} />;
      case 'finance-monthly': return <Finance mode="monthly" students={students} payments={payments} onPaymentsChange={setPayments} />;
      case 'finance-yearly': return <Finance mode="yearly" students={students} payments={payments} onPaymentsChange={setPayments} />;
      case 'reports': return <Reports students={students} payments={payments} />;
      case 'admin-management': return role === 'super_admin' ? <AdminManagement /> : <div style={{ padding: 40, textAlign: 'center', color: '#6B7C8D' }}>Akses ditolak</div>;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };
  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={() => {
        writeAuthSession();
        setCurrentPage('dashboard');
        setNavContext({});
      }}
      role={role}
      adminName={role === 'super_admin' ? 'Super Admin EdGLO' : 'Admin EdGLO'}
    >
      {renderPage()}
    </Layout>
  );
}
