'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';
type ToastItem = { id: number; title: string; message?: string; tone: ToastTone };
type ToastInput = Omit<ToastItem, 'id'>;
type ToastContextValue = { notify: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const FALLBACK_TOAST: ToastContextValue = { notify: () => undefined };
const ICONS: Record<ToastTone, string> = { success: '✓', error: '!', warning: '!', info: 'i' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => dismiss(id), 3600);
  }, [dismiss]);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`app-toast toast-${toast.tone}`} role="status" key={toast.id}>
            <span className="toast-icon" aria-hidden="true">{ICONS[toast.tone]}</span>
            <div className="toast-copy"><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Tutup notifikasi">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) ?? FALLBACK_TOAST;
}
