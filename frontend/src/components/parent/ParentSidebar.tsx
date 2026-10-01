'use client';

import Image from 'next/image';
import { CalendarClock, CalendarDays, CalendarPlus, ClipboardCheck, CreditCard, LayoutDashboard, LogOut, PackageOpen, UserRound, X } from 'lucide-react';
import type { ParentPortalPage } from './parentPortalConfig';

type Props = {
  currentPage: ParentPortalPage;
  parentName: string;
  pendingRequests: Record<'schedule-request' | 'schedule-add' | 'program-request', number>;
  mobileOpen: boolean;
  onNavigate: (page: ParentPortalPage) => void;
  onClose: () => void;
  onLogout: () => void;
};

const sections: Array<{ title: string; items: Array<{ page: ParentPortalPage; label: string; icon: typeof LayoutDashboard }> }> = [
  { title: 'Ringkasan', items: [{ page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Akademik', items: [
    { page: 'children', label: 'Anak & Program', icon: UserRound },
    { page: 'schedule', label: 'Jadwal Belajar', icon: CalendarDays },
    { page: 'schedule-request', label: 'Ubah Jadwal', icon: CalendarClock },
    { page: 'schedule-add', label: 'Tambah Jadwal', icon: CalendarPlus },
    { page: 'program-request', label: 'Ubah Paket', icon: PackageOpen },
  ] },
  { title: 'Administrasi', items: [
    { page: 'payments', label: 'Pembayaran', icon: CreditCard },
    { page: 'registrations', label: 'Pendaftaran', icon: ClipboardCheck },
  ] },
];

export default function ParentSidebar({ currentPage, parentName, pendingRequests, mobileOpen, onNavigate, onClose, onLogout }: Props) {
  const navigate = (page: ParentPortalPage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      <button type="button" className={`parent-sidebar-backdrop${mobileOpen ? ' visible' : ''}`} onClick={onClose} aria-label="Tutup menu" />
      <aside className={`parent-sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="parent-sidebar-brand">
          <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority />
          <button type="button" onClick={onClose} aria-label="Tutup menu"><X size={19} /></button>
        </div>
        <nav aria-label="Menu portal orang tua">
          {sections.map((section) => <div className="parent-nav-section" key={section.title}>
            <span>{section.title}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const pending = item.page === 'schedule-request' || item.page === 'schedule-add' || item.page === 'program-request' ? pendingRequests[item.page] : 0;
              return <button type="button" key={item.page} className={currentPage === item.page ? 'active' : ''} onClick={() => navigate(item.page)}><Icon size={18} /><strong>{item.label}</strong>{pending > 0 && <small>{pending}</small>}</button>;
            })}
          </div>)}
        </nav>
        <div className="parent-sidebar-account"><span>{parentName.charAt(0)}</span><div><strong>{parentName}</strong><small>Orang tua murid</small></div><button type="button" onClick={onLogout} title="Keluar" aria-label="Keluar"><LogOut size={17} /></button></div>
      </aside>
    </>
  );
}
