import type { Metadata } from 'next';
import TeacherPortal from './TeacherPortal';

export const metadata: Metadata = { title: 'Portal Guru | EdGLO' };

export default function TeacherPage() {
  return <TeacherPortal />;
}
