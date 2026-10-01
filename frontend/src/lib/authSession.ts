import type { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'edglo-auth';
const AUTH_CHANGE_EVENT = 'edglo-auth-change';

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

export function getAuthSnapshot(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? '';
}

export function getServerAuthSnapshot(): string | null {
  return null;
}

export function parseAuthSession(snapshot: string): AuthSession | null {
  try {
    const session = JSON.parse(snapshot) as Partial<AuthSession>;
    return session.token && session.user?.id ? session as AuthSession : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session?: AuthSession) {
  if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_STORAGE_KEY);

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
