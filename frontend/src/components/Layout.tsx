'use client';

import Image from 'next/image';
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { TODAY } from '../data/mockData';
import type { AccountRole, Page } from '../types';

type NavItem = {
  page: Page;
  label: string;
  icon: ReactNode;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SIDEBAR_STORAGE_KEY = 'edglo-sidebar-state';
const SIDEBAR_CHANGE_EVENT = 'edglo-sidebar-change';

const subscribeSidebar = (callback: () => void) => {
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};

const getSidebarSnapshot = () => localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? 'expanded';
const getSidebarServerSnapshot = () => 'expanded';

const saveSidebarState = (collapsed: boolean) => {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
};

const Svg = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Ringkasan',
    items: [
      {
        page: 'dashboard',
        label: 'Dashboard',
        icon: <Svg><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>,
      },
    ],
  },
  {
    title: 'Data Akademik',
    items: [
      {
        page: 'registrations',
        label: 'Pendaftaran Baru',
        adminOnly: true,
        icon: <Svg><path d="M9 5h6M9 9h6M9 13h3" /><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="m15 16 2 2 4-4" /></Svg>,
      },
      {
        page: 'students',
        label: 'Data Murid',
        icon: <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></Svg>,
      },
      {
        page: 'student-activation',
        label: 'Status Murid',
        icon: <Svg><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></Svg>,
      },
      {
        page: 'teachers',
        label: 'Data Guru',
        icon: <Svg><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></Svg>,
      },
      {
        page: 'teacher-activation',
        label: 'Status Guru',
        icon: <Svg><path d="M16 3.5a4 4 0 1 1-8 0" /><path d="M5 21a7 7 0 0 1 14 0" /><path d="m16.5 12.5 1.5 1.5 3-3" /></Svg>,
      },
      {
        page: 'schedule',
        label: 'Jadwal Belajar',
        icon: <Svg><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>,
      },
      {
        page: 'attendance',
        label: 'Absensi & Pengganti',
        icon: <Svg><path d="M9 11l2 2 4-4" /><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /></Svg>,
      },
    ],
  },
  {
    title: 'Administrasi',
    items: [
      {
        page: 'finance-monthly',
        label: 'Keuangan Bulanan',
        icon: <Svg><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5ZM7 6V4h10v2" /></Svg>,
      },
      {
        page: 'finance-yearly',
        label: 'Keuangan Tahunan',
        icon: <Svg><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>,
      },
      {
        page: 'reports',
        label: 'Laporan PDF',
        icon: <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></Svg>,
      },
      {
        page: 'payroll',
        label: 'Slip Gaji Guru',
        superAdminOnly: true,
        icon: <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h10M16 9h1" /></Svg>,
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      {
        page: 'admin-management',
        label: 'Kelola Admin',
        superAdminOnly: true,
        icon: <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Svg>,
      },
      {
        page: 'settings',
        label: 'Pengaturan Akun',
        icon: <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21h-4v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21v4h-.05A1.7 1.7 0 0 0 19.4 15Z" /></Svg>,
      },
    ],
  },
];

const PAGE_META: Record<Page, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Ringkasan operasional EdGLO hari ini' },
  registrations: { title: 'Pendaftaran Baru', description: 'Verifikasi formulir calon murid dari landing page' },
  students: { title: 'Data Murid', description: 'Kelola data dan informasi murid' },
  'student-form': { title: 'Form Murid', description: 'Lengkapi informasi murid' },
  'student-detail': { title: 'Detail Murid', description: 'Informasi lengkap murid' },
  'student-activation': { title: 'Status Murid', description: 'Kelola status aktif dan riwayat murid' },
  teachers: { title: 'Data Guru', description: 'Kelola data dan informasi guru' },
  'teacher-form': { title: 'Form Guru', description: 'Lengkapi informasi guru' },
  'teacher-detail': { title: 'Detail Guru', description: 'Informasi lengkap guru' },
  'teacher-activation': { title: 'Status Guru', description: 'Kelola status aktif dan riwayat guru' },
  schedule: { title: 'Jadwal Belajar', description: 'Pantau seluruh sesi belajar mingguan' },
  'schedule-requests': { title: 'Pengajuan Akademik', description: 'Tinjau pengajuan jadwal dan paket dari orang tua' },
  attendance: { title: 'Absensi & Pengganti', description: 'Catat kehadiran dan atur kelas pengganti' },
  'finance-monthly': { title: 'Keuangan Bulanan', description: 'Pantau pembayaran dan pemasukan bulanan' },
  'finance-yearly': { title: 'Keuangan Tahunan', description: 'Analisis rekap pemasukan tahunan' },
  reports: { title: 'Laporan PDF', description: 'Unduh laporan administrasi EdGLO' },
  payroll: { title: 'Slip Gaji Guru', description: 'Hitung penggajian berdasarkan sesi mengajar' },
  'admin-management': { title: 'Kelola Admin', description: 'Atur akun dan hak akses pengelola' },
  settings: { title: 'Pengaturan Akun', description: 'Perbarui profil dan keamanan akun' },
};

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  role: AccountRole;
  adminName: string;
  pendingRegistrations?: number;
  pendingScheduleRequests?: number;
  children: ReactNode;
};

export default function Layout({ currentPage, onNavigate, onLogout, role, adminName, pendingRegistrations = 0, pendingScheduleRequests = 0, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarState = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );
  const sidebarCollapsed = sidebarState === 'collapsed';
  const contentRef = useRef<HTMLElement>(null);
  const pageMeta = PAGE_META[currentPage];
  const currentDate = new Date(`${TODAY}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('edglo-theme', nextTheme);
  };

  const isActive = (page: Page) =>
    currentPage === page ||
    (page === 'students' && ['student-form', 'student-detail'].includes(currentPage)) ||
    (page === 'student-activation' && currentPage === 'student-activation') ||
    (page === 'teachers' && ['teacher-form', 'teacher-detail'].includes(currentPage)) ||
    (page === 'teacher-activation' && currentPage === 'teacher-activation');

  const navigate = (page: Page) => {
    contentRef.current?.scrollTo({ top: 0 });
    onNavigate(page);
    setMobileOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className="admin-shell">
      <button
        type="button"
        className={`sidebar-backdrop${mobileOpen ? ' visible' : ''}`}
        aria-label="Tutup menu"
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`app-sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Image
            src="/edglo-logo.png"
            alt="EdGLO"
            width={512}
            height={512}
            priority
            className="sidebar-logo"
          />
          <button type="button" className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu">
            <Svg size={20}><path d="m6 6 12 12M18 6 6 18" /></Svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) =>
              (!item.superAdminOnly || role === 'super_admin') && (!item.adminOnly || role === 'admin'),
            );
            if (!visibleItems.length) return null;

            return (
              <div className="nav-section" key={section.title}>
                <div className="nav-section-label">{section.title}</div>
                {visibleItems.map((item) => (
                  <button
                    type="button"
                    key={item.page}
                    className={`sidebar-link${isActive(item.page) ? ' active' : ''}`}
                    onClick={() => navigate(item.page)}
                    aria-label={item.label}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span className="sidebar-link-label">{item.label}</span>
                    {item.page === 'registrations' && pendingRegistrations > 0 && <span className="sidebar-nav-count">{pendingRegistrations > 99 ? '99+' : pendingRegistrations}</span>}
                    {item.page === 'schedule-requests' && pendingScheduleRequests > 0 && <span className="sidebar-nav-count">{pendingScheduleRequests > 99 ? '99+' : pendingScheduleRequests}</span>}
                    {isActive(item.page) && <span className="active-indicator" />}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

      </aside>

      <div className="app-workspace">
        <header className="topbar">
          <div className="topbar-heading">
            <button type="button" className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
              <Svg size={21}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
            </button>
            <button
              type="button"
              className="icon-button desktop-sidebar-toggle"
              onClick={() => saveSidebarState(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
              aria-pressed={sidebarCollapsed}
              title={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            >
              <Svg size={19}>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d={sidebarCollapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'} />
              </Svg>
            </button>
            <div>
              <h1>{pageMeta.title}</h1>
              <p>{pageMeta.description}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Ganti tema putih atau hitam" title="Ganti tema">
              <span className="theme-icon theme-icon-dark"><Svg size={18}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" /></Svg></span>
              <span className="theme-icon theme-icon-light"><Svg size={18}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></Svg></span>
            </button>
            <div className="date-chip">
              <Svg size={16}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>
              <span>{currentDate}</span>
            </div>
            <div className="profile-menu-wrap">
              <button
                type="button"
                className={`topbar-profile${profileOpen ? ' open' : ''}`}
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                title="Menu akun"
              >
                <span className="profile-avatar small">{adminName.charAt(0)}</span>
                <span className="topbar-profile-copy">
                  <strong>{adminName.replace(' EdGLO', '')}</strong>
                  <span>{role === 'super_admin' ? 'Super Admin (Owner)' : 'Admin'}</span>
                </span>
                <Svg size={15}><path d="m6 9 6 6 6-6" /></Svg>
              </button>

              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-head">
                    <span className="profile-avatar">{adminName.charAt(0)}</span>
                    <div>
                      <strong>{adminName}</strong>
                      <span>{role === 'super_admin' ? 'Super Admin (Owner)' : 'Admin'}</span>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <button type="button" role="menuitem" onClick={() => navigate('settings')}>
                    <Svg size={17}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4M9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15M4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6M15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9" /></Svg>
                    <span>Pengaturan Akun</span>
                  </button>
                  {role === 'super_admin' && (
                    <button type="button" role="menuitem" onClick={() => navigate('admin-management')}>
                      <Svg size={17}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Svg>
                      <span>Kelola Admin</span>
                    </button>
                  )}
                  <div className="profile-dropdown-divider" />
                  <button
                    type="button"
                    role="menuitem"
                    className="logout-button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                  >
                    <Svg size={17}><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></Svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main ref={contentRef} className="app-content">{children}</main>
      </div>
    </div>
  );
}
