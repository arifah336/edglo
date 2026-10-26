'use client';

import Image from 'next/image';
import { BookOpenCheck, CalendarRange, GraduationCap, LayoutDashboard } from 'lucide-react';
import type { TeacherOverview } from '../../../types';

export type TeacherPortalView = 'dashboard' | 'schedule' | 'students' | 'progress';

const MENU = [
  { id: 'dashboard' as const, label: 'Ringkasan', caption: 'Aktivitas hari ini', icon: LayoutDashboard },
  { id: 'schedule' as const, label: 'Jadwal & Kelas', caption: 'Agenda mengajar', icon: CalendarRange },
  { id: 'students' as const, label: 'Murid', caption: 'Anak tanggungan', icon: GraduationCap },
  { id: 'progress' as const, label: 'Perkembangan', caption: 'Catat aktivitas', icon: BookOpenCheck },
];

type Props = {
  overview: TeacherOverview;
  activeView: TeacherPortalView;
  onViewChange: (view: TeacherPortalView) => void;
};

export default function TeacherSidebar({ overview, activeView, onViewChange }: Props) {
  return (
    <aside className="teacher-portal-sidebar">
      <div className="teacher-sidebar-brand">
        <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority />
      </div>
      <div className="teacher-portal-side-title">PORTAL GURU</div>
      <nav className="teacher-main-nav" aria-label="Navigasi portal guru">
        {MENU.map(({ id, label, caption, icon: Icon }) => (
          <button
            type="button"
            className={activeView === id ? 'active' : ''}
            aria-current={activeView === id ? 'page' : undefined}
            title={label}
            key={id}
            onClick={() => onViewChange(id)}
          >
            <Icon size={18} />
            <span><strong>{label}</strong><small>{caption}</small></span>
            {id === 'students' && <b>{overview.summary.activeStudents}</b>}
          </button>
        ))}
      </nav>
      <div className="teacher-sidebar-status">
        <span><i />Akun aktif</span>
        <small>Data tersambung dengan sistem EdGLO</small>
      </div>
    </aside>
  );
}
