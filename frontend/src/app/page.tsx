import App from '../App';

import { ToastProvider } from '../components/ui/ToastProvider';

export default function Home() {
  return <ToastProvider><App /></ToastProvider>;
}
