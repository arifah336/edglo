import type { Metadata } from 'next';
import TeacherLogin from './TeacherLogin';

export const metadata: Metadata = { title: 'Login Guru | EdGLO' };

export default function TeacherLoginPage() {
  return <TeacherLogin />;
}
