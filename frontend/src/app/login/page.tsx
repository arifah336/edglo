import type { Metadata } from 'next';
import Login from './Login';

export const metadata: Metadata = {
  title: 'Login | EdGLO Admin Panel',
};

export default function LoginPage() {
  return <Login />;
}
