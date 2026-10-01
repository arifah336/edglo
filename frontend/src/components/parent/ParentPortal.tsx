'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, MessageCircleMore, RefreshCw } from 'lucide-react';
import type { ParentOverview } from '../../types';
import { ApiError, api } from '../../lib/api';
import { getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from '../../lib/authSession';
import ParentSidebar from './ParentSidebar';
import ParentChildrenPage from './pages/ParentChildrenPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ParentPaymentsPage from './pages/ParentPaymentsPage';
import ParentRegistrationsPage from './pages/ParentRegistrationsPage';
import ParentSchedulePage from './pages/ParentSchedulePage';
import ParentScheduleRequestPage from './pages/ParentScheduleRequestPage';
import ParentAddSchedulePage from './pages/ParentAddSchedulePage';
import ParentProgramRequestPage from './pages/ParentProgramRequestPage';
import { dayOrder, parentPageMeta, type ParentPortalPage } from './parentPortalConfig';

export default function ParentPortal() {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const session = authSnapshot === null ? null : parseAuthSession(authSnapshot);
  const token = session?.token;
  const role = session?.user.role;
  const [overview, setOverview] = useState<ParentOverview | null>(null);
  const [currentPage, setCurrentPage] = useState<ParentPortalPage>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState('');
  const whatsapp = process.env.NEXT_PUBLIC_EDGLO_WHATSAPP ?? '628111222333';

  const loadOverview = useCallback(async () => {
    if (!token || role !== 'parent') return;
    setError('');
    try {
      setOverview(await api.parentOverview(token));
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        writeAuthSession();
        router.replace('/parent/login');
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Portal belum dapat dimuat.');
    }
  }, [role, router, token]);

  useEffect(() => {
    if (authSnapshot === null) return;
    if (!session) router.replace('/parent/login');
    else if (session.user.role !== 'parent') router.replace('/dashboard');
  }, [authSnapshot, router, session]);

  useEffect(() => {
    if (role !== 'parent') return;
    const timer = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview, role]);

  const sessions = useMemo(
    () => [...(overview?.sessions ?? [])].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.time.localeCompare(b.time)),
    [overview?.sessions],
  );
  const pendingRequests = {
    'schedule-request': (overview?.scheduleChangeRequests ?? []).filter((item) => item.status === 'pending' && (item.requestType ?? 'change_schedule') === 'change_schedule').length,
    'schedule-add': (overview?.scheduleChangeRequests ?? []).filter((item) => item.status === 'pending' && item.requestType === 'add_schedule').length,
    'program-request': (overview?.scheduleChangeRequests ?? []).filter((item) => item.status === 'pending' && item.requestType === 'change_program').length,
  };

  const logout = async () => {
    const logoutToken = token;
    writeAuthSession();
    router.replace('/parent/login');
    if (logoutToken) await api.logout(logoutToken).catch(() => undefined);
  };

  if (authSnapshot === null || !session || session.user.role !== 'parent') {
    return <div className="grid min-h-screen place-items-center bg-white"><div className="flex items-center gap-3 text-sm font-bold text-slate-600"><RefreshCw size={18} className="animate-spin text-[#087f9b]" />Memulihkan portal...</div></div>;
  }

  if (!overview) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f8fa] px-5"><div className="max-w-md text-center"><Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} className="mx-auto h-[110px] w-[230px] object-cover object-[center_44%]" priority />{error ? <><h1 className="mt-5 text-xl font-extrabold text-slate-950">Portal belum dapat dibuka</h1><p className="mt-2 text-sm leading-6 text-slate-600">{error}</p><button type="button" onClick={() => void loadOverview()} className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#087f9b] px-5 text-sm font-bold text-white"><RefreshCw size={16} />Coba lagi</button></> : <div className="mt-5 flex items-center justify-center gap-3 text-sm font-bold text-slate-600"><RefreshCw size={18} className="animate-spin text-[#087f9b]" />Menyiapkan portal keluarga...</div>}</div></div>;
  }

  const navigate = (page: ParentPortalPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'children': return <ParentChildrenPage students={overview.students} />;
      case 'schedule': return <ParentSchedulePage sessions={sessions} students={overview.students} />;
      case 'schedule-request': return <ParentScheduleRequestPage token={token!} students={overview.students} sessions={sessions} requests={overview.scheduleChangeRequests ?? []} onCreated={(request) => setOverview((current) => current ? { ...current, scheduleChangeRequests: [request, ...(current.scheduleChangeRequests ?? [])] } : current)} />;
      case 'schedule-add': return <ParentAddSchedulePage token={token!} students={overview.students} requests={overview.scheduleChangeRequests ?? []} onCreated={(request) => setOverview((current) => current ? { ...current, scheduleChangeRequests: [request, ...(current.scheduleChangeRequests ?? [])] } : current)} />;
      case 'program-request': return <ParentProgramRequestPage token={token!} students={overview.students} programs={overview.programs ?? []} requests={overview.scheduleChangeRequests ?? []} onCreated={(request) => setOverview((current) => current ? { ...current, scheduleChangeRequests: [request, ...(current.scheduleChangeRequests ?? [])] } : current)} />;
      case 'payments': return <ParentPaymentsPage payments={overview.payments} />;
      case 'registrations': return <ParentRegistrationsPage registrations={overview.registrations} />;
      default: return <ParentDashboardPage overview={overview} sessions={sessions} onNavigate={navigate} />;
    }
  };

  return (
    <div className="parent-portal-page parent-app-shell">
      <ParentSidebar currentPage={currentPage} parentName={overview.user.name} pendingRequests={pendingRequests} mobileOpen={mobileOpen} onNavigate={navigate} onClose={() => setMobileOpen(false)} onLogout={() => void logout()} />
      <div className="parent-app-workspace">
        <header className="parent-topbar">
          <div className="parent-topbar-heading"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu size={20} /></button><div><h1>{parentPageMeta[currentPage].title}</h1><p>{parentPageMeta[currentPage].description}</p></div></div>
          <div className="parent-topbar-actions"><a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Halo EdGLO, saya ingin menanyakan kegiatan belajar anak.')}`} target="_blank" rel="noreferrer"><MessageCircleMore size={17} /><span>Hubungi EdGLO</span></a><div><span>{overview.user.name.charAt(0)}</span><div><strong>{overview.user.name}</strong><small>Orang tua</small></div></div></div>
        </header>
        <main className="parent-app-content">{renderPage()}</main>
      </div>
    </div>
  );
}
