import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EdGLO Admin Panel',
  description: 'Sistem manajemen lembaga EdGLO.',
  icons: {
    icon: [{ url: '/edglo-icon.png', type: 'image/png', sizes: '500x500' }],
    shortcut: '/edglo-icon.png',
    apple: '/edglo-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('edglo-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}" }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
