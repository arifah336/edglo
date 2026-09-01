import { useState } from 'react';
import type { Admin, UserRole } from '../../types';

export type AdminProfileInput = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  passwordConfirmation?: string;
};

type Props = {
  admin: Admin | null;
  admins: Admin[];
  onClose: () => void;
  onSave: (profile: AdminProfileInput) => void | Promise<void>;
};

export default function AdminCredentialModal({ admin, admins, onClose, onSave }: Props) {
  const [profile, setProfile] = useState<AdminProfileInput>({
    name: admin?.name ?? '',
    email: admin?.email ?? '',
    phone: admin?.phone ?? '',
    role: admin?.role ?? 'admin',
  });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const passwordScore = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strengthLabel = ['Belum diisi', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][passwordScore];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanProfile = {
      ...profile,
      name: profile.name.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
    };

    if (!cleanProfile.name || !cleanProfile.email) {
      setError('Nama lengkap dan email login wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanProfile.email)) {
      setError('Format email login belum valid.');
      return;
    }
    if (admins.some((item) => item.id !== admin?.id && item.email.toLowerCase() === cleanProfile.email)) {
      setError('Email login sudah digunakan oleh admin lain.');
      return;
    }
    if (!admin && !password) {
      setError('Password wajib dibuat untuk admin baru.');
      return;
    }
    if (password && password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmation) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    onSave({
      ...cleanProfile,
      password: password || undefined,
      passwordConfirmation: confirmation || undefined,
    });
  };

  return (
    <div className="modal-overlay">
      <form className="modal-box admin-credential-modal" onSubmit={submit}>
        <div className="admin-credential-header">
          <div><span className="eyebrow">AKSES ADMIN</span><h2>{admin ? 'Edit akun admin' : 'Tambah admin baru'}</h2><p>Kelola profil dan kredensial untuk masuk ke EdGLO Admin Panel.</p></div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Tutup">x</button>
        </div>

        <div className="admin-credential-grid">
          <section>
            <div className="admin-form-section-title"><span>01</span><div><strong>Informasi Admin</strong><small>Identitas dan hak akses pengguna</small></div></div>
            <div className="admin-form-fields">
              <div><label className="input-label">Nama Lengkap *</label><input className="input-field" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} placeholder="Nama admin" /></div>
              <div><label className="input-label">No. Telepon</label><input className="input-field" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="08xxxxxxxxxx" inputMode="tel" /></div>
              <div><label className="input-label">Role *</label><select className="input-field" value={profile.role} onChange={(event) => setProfile((current) => ({ ...current, role: event.target.value as UserRole }))}><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
            </div>
          </section>

          <section>
            <div className="admin-form-section-title"><span>02</span><div><strong>Kredensial Login</strong><small>Email dan keamanan akun</small></div></div>
            <div className="admin-form-fields">
              <div><label className="input-label">Email Login *</label><input className="input-field" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} placeholder="admin@edglo.id" autoComplete="username" /></div>
              <div><label className="input-label">{admin ? 'Password Baru' : 'Password *'}</label><div className="admin-password-field"><input className="input-field" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} placeholder={admin ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</button></div></div>
              <div><label className="input-label">Konfirmasi Password {admin ? '' : '*'}</label><input className="input-field" type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} placeholder="Ketik ulang password" autoComplete="new-password" /></div>
              <div className="admin-password-strength"><div>{[1, 2, 3, 4].map((level) => <i className={passwordScore >= level ? `active level-${passwordScore}` : ''} key={level} />)}</div><span>{strengthLabel}</span></div>
            </div>
          </section>
        </div>

        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-credential-actions"><div><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button type="submit" className="btn-primary">{admin ? 'Simpan Perubahan' : 'Buat Akun Admin'}</button></div></div>
      </form>
    </div>
  );
}
