'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CalendarDays, ChevronDown, LogOut, Mail, Menu, Moon, Sun, UserRound } from 'lucide-react';
import type { StudentProgressLog, TeacherOverview, TeacherPortalClass } from '../../types';
import { api } from '../../lib/api';
import { getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from '../../lib/authSession';
import { formatIndonesiaDate, getIndonesiaDateParts, getIndonesiaToday } from '../../lib/indonesiaTime';
import SessionLoading from '../../components/auth/SessionLoading';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherProgress from './components/TeacherProgress';
import TeacherSchedule from './components/TeacherSchedule';
import TeacherSidebar, { type TeacherPortalView } from './components/TeacherSidebar';
import TeacherStudents from './components/TeacherStudents';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const VIEW_META: Record<TeacherPortalView, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: 'PORTAL GURU', title: 'Ringkasan mengajar', description: 'Agenda, kelas, dan perkembangan murid dalam satu tampilan.' },
  schedule: { eyebrow: 'AGENDA MENGAJAR', title: 'Jadwal & kelas', description: 'Lihat jam mengajar, ruang kelas, program, dan peserta.' },
  students: { eyebrow: 'MONITORING GURU', title: 'Murid tanggungan', description: 'Pantau anak aktif yang menjadi tanggung jawab Anda.' },
  progress: { eyebrow: 'PERKEMBANGAN MURID', title: 'Catatan belajar', description: 'Catat aktivitas dan poin perkembangan setiap murid.' },
};

function fallbackClasses(overview: TeacherOverview): TeacherPortalClass[] {
  return overview.students.flatMap((student) => student.schedules.map((schedule, index) => ({
    id: `${student.id}-${schedule.day}-${schedule.time}-${index}`,
    day: schedule.day,
    time: schedule.time,
    room: 'Ruang belum ditentukan',
    programName: student.programName,
    capacity: 1,
    students: [{ id: student.id, fullName: student.fullName, photo: student.photo }],
  })));
}

function upcomingClasses(classes: TeacherPortalClass[], currentDayName: string, currentMinutes: number) {
  const currentDay = Math.max(0, DAYS.indexOf(currentDayName));
  return [...classes].sort((a, b) => {
    const score = (item: TeacherPortalClass) => {
      const dayIndex = Math.max(0, DAYS.indexOf(item.day));
      const [hours, minutes] = item.time.replace('.', ':').split(':').map(Number);
      let dayDistance = (dayIndex - currentDay + 7) % 7;
      const time = hours * 60 + minutes;
      if (dayDistance === 0 && time < currentMinutes) dayDistance = 7;
      return dayDistance * 1440 + time;
    };
    return score(a) - score(b);
  }).slice(0, 3);
}

export default function TeacherPortal() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const session = snapshot === null ? null : parseAuthSession(snapshot);
  const token = session?.token;
  const role = session?.user.role;
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [activeView, setActiveView] = useState<TeacherPortalView>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ activityDate: getIndonesiaToday(), activityType: 'reading' as StudentProgressLog['activityType'], points: 10, notes: '' });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loadOverview = useCallback(async () => {
    if (!token || role !== 'teacher') return;
    try {
      const data = await api.teacherOverview(token);
      setOverview(data);
      setSelectedId((current) => current || data.students[0]?.id || '');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Data monitoring belum dapat dimuat.');
    }
  }, [role, token]);

  useEffect(() => {
    if (snapshot === null) return;
    if (!token) router.replace('/teacher/login');
    else if (role !== 'teacher') router.replace('/dashboard');
    else {
      const timer = window.setTimeout(() => void loadOverview(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadOverview, role, router, snapshot, token]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeProfileMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeProfileMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const syncViewport = () => setIsMobile(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  const saveProgress = async () => {
    if (!token || !selectedId) return;
    setSaving(true);
    try {
      await api.saveStudentProgress(token, { ...form, studentId: selectedId });
      setForm((current) => ({ ...current, points: 10, notes: '' }));
      await loadOverview();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Catatan gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProgress = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteStudentProgress(token, id);
      await loadOverview();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Catatan gagal dihapus.');
    }
  };

  const logout = async () => {
    const logoutToken = token;
    setProfileOpen(false);
    writeAuthSession();
    router.replace('/teacher/login');
    if (logoutToken) await api.logout(logoutToken).catch(() => undefined);
  };

  const now = useMemo(() => new Date(), []);
  const indonesiaNow = useMemo(() => getIndonesiaDateParts(now), [now]);
  const todayName = formatIndonesiaDate(now, { weekday: 'long' });
  const classes = useMemo(() => {
    if (!overview) return [];
    return overview.classes?.length ? overview.classes : fallbackClasses(overview);
  }, [overview]);
  const todayClasses = useMemo(() => classes.filter((item) => item.day === todayName).sort((a, b) => a.time.localeCompare(b.time)), [classes, todayName]);
  const nextClasses = useMemo(() => upcomingClasses(classes, todayName, indonesiaNow.hour * 60 + indonesiaNow.minute), [classes, indonesiaNow.hour, indonesiaNow.minute, todayName]);
  const recentActivities = useMemo(() => overview?.students.flatMap((student) => student.progressLogs.map((log) => ({ ...log, studentName: student.fullName }))).sort((a, b) => b.activityDate.localeCompare(a.activityDate)) ?? [], [overview]);
  const todayIso = indonesiaNow.isoDate;
  const todayActivityCount = recentActivities.filter((activity) => activity.activityDate === todayIso).length;

  const recordProgress = (studentId?: string) => {
    if (studentId) setSelectedId(studentId);
    else if (!selectedId && overview?.students[0]) setSelectedId(overview.students[0].id);
    setActiveView('progress');
  };

  const changeView = (view: TeacherPortalView) => {
    setActiveView(view);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('edglo-theme', nextTheme);
  };

  if (snapshot === null || !session || session.user.role !== 'teacher' || !overview) {
    return <SessionLoading message={error || 'Menyiapkan portal guru...'} />;
  }

  const meta = VIEW_META[activeView];
  const employmentLabel = overview.teacher.employmentType === 'fulltime'
    ? 'Guru Fulltime'
    : overview.teacher.employmentType === 'parttime' ? 'Guru Part Time' : 'Guru Magang';
  const sidebarExpanded = isMobile ? mobileSidebarOpen : !sidebarCollapsed;

  return (
    <main className={`teacher-portal-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileSidebarOpen ? ' sidebar-mobile-open' : ''}`}>
      <TeacherSidebar overview={overview} activeView={activeView} onViewChange={changeView} />
      <button type="button" className="teacher-sidebar-overlay" aria-label="Tutup menu navigasi" onClick={() => setMobileSidebarOpen(false)} />
      <section className="teacher-portal-workspace">
        <header className="teacher-topbar">
          <div className="teacher-topbar-left">
            <button type="button" className="teacher-menu-button" aria-label="Buka atau tutup menu" aria-expanded={sidebarExpanded} onClick={toggleSidebar}><Menu size={20} /></button>
            <div><strong>Portal Guru</strong><small>EdGLO Learning Center</small></div>
          </div>
          <div className="teacher-topbar-actions">
            <button type="button" className="teacher-theme-toggle" onClick={toggleTheme} aria-label="Ganti tema terang atau gelap" title="Ganti tema">
              <span className="teacher-theme-icon teacher-theme-icon-dark"><Moon size={18} /></span>
              <span className="teacher-theme-icon teacher-theme-icon-light"><Sun size={18} /></span>
            </button>
            <div className="teacher-portal-date"><CalendarDays size={18} /><span><small>{todayName}</small>{formatIndonesiaDate(now, { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
            <div className="teacher-profile-menu" ref={profileMenuRef}>
              <button type="button" className="teacher-profile-trigger" aria-label="Buka menu profil" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                <span style={overview.teacher.photo ? { backgroundImage: `url(${overview.teacher.photo})` } : undefined}>{overview.teacher.photo ? '' : overview.teacher.fullName.charAt(0)}</span>
                <div><strong>{overview.teacher.fullName}</strong><small>{employmentLabel}</small></div>
                <ChevronDown size={16} />
              </button>
              {profileOpen && <div className="teacher-profile-dropdown" role="menu">
                <div className="teacher-profile-dropdown-head"><span style={overview.teacher.photo ? { backgroundImage: `url(${overview.teacher.photo})` } : undefined}>{overview.teacher.photo ? '' : overview.teacher.fullName.charAt(0)}</span><div><strong>{overview.teacher.fullName}</strong><small>{employmentLabel}</small></div></div>
                <div className="teacher-profile-detail"><UserRound size={15} /><span><small>ID Guru</small>{overview.teacher.id}</span></div>
                <div className="teacher-profile-detail"><Mail size={15} /><span><small>Email akun</small>{session.user.email}</span></div>
                <button type="button" role="menuitem" className="teacher-profile-logout" onClick={() => void logout()}><LogOut size={16} />Keluar dari akun</button>
              </div>}
            </div>
          </div>
        </header>
        <div className="teacher-page-content">
          <header className="teacher-page-heading"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p></div></header>
          {error && <div className="teacher-portal-error">{error}</div>}

          {activeView === 'dashboard' && <TeacherDashboard overview={{ ...overview, classes }} todayClasses={todayClasses} upcomingClasses={nextClasses} recentActivities={recentActivities} todayActivityCount={todayActivityCount} onNavigate={changeView} onRecordProgress={recordProgress} />}
          {activeView === 'schedule' && <TeacherSchedule classes={classes} todayName={todayName} />}
          {activeView === 'students' && <TeacherStudents students={overview.students} onRecordProgress={recordProgress} />}
          {activeView === 'progress' && <TeacherProgress students={overview.students} selectedId={selectedId} onSelect={setSelectedId} form={form} onFormChange={setForm} saving={saving} onSave={() => void saveProgress()} onDelete={(id) => void deleteProgress(id)} />}
        </div>
      </section>
    </main>
  );
}
