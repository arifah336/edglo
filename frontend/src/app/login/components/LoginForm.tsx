'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (email: string, password: string) => Promise<void>;
  emailPlaceholder?: string;
  submitLabel?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi server.';
}

export default function LoginForm({ onSubmit, emailPlaceholder = 'nama@email.com', submitLabel = 'Masuk' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(email.trim().toLowerCase(), password);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form suppressHydrationWarning onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label className="input-label" htmlFor="login-email">Email</label>
        <input id="login-email" suppressHydrationWarning className="input-field" type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={emailPlaceholder} required />
      </div>
      <div>
        <label className="input-label" htmlFor="login-password">Password</label>
        <input id="login-password" suppressHydrationWarning className="input-field" type="password" name="password" autoCapitalize="none" autoCorrect="off" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required />
      </div>
      {error && <div className="login-error" role="alert">{error}</div>}
      <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 15, marginTop: 4 }}>
        {loading ? 'Memeriksa akun...' : submitLabel}
      </button>
    </form>
  );
}
