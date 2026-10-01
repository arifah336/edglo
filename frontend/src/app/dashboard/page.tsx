import App from '../../App';
import { ToastProvider } from '../../components/ui/ToastProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | EdGLO Admin Panel',
};

export default function DashboardPage() {
  return <ToastProvider><App /></ToastProvider>;
}
