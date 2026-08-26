import { useState } from 'react';
import type { AuthUser } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { api } from '../lib/api';

type Props = {
  user: AuthUser;
  token: string;
  onUserChange: (user: AuthUser) => void;
};

export default function Settings({ user, token, onUserChange }: Props) {
  const { notify } = useToast();
  const [profile, setProfile] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await api.updateProfile(token, profile);
      onUserChange(updatedUser);
      if (passwords.current || passwords.newPass || passwords.confirm) {
        if (!passwords.current || !passwords.newPass || passwords.newPass !== passwords.confirm) {
          throw new Error('Lengkapi password saat ini dan pastikan konfirmasi password baru sama.');
        }
        await api.updatePassword(token, passwords.current, passwords.newPass, passwords.confirm);
        setPasswords({ current: '', newPass: '', confirm: '' });
      }
      notify({ tone: 'success', title: 'Pengaturan disimpan', message: 'Profil akun backend berhasil diperbarui.' });
    } catch (error) {
      notify({ tone: 'error', title: 'Pengaturan gagal disimpan', message: error instanceof Error ? error.message : 'Permintaan ke server gagal.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Profil Akun</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2F7884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, color: 'white' }}>{profile.name.charAt(0)}</div>
          <div><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#1F2933' }}>{profile.name}</div><span className="badge badge-active">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="input-label" htmlFor="settings-name">Nama Lengkap</label><input id="settings-name" className="input-field" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></div>
          <div><label className="input-label" htmlFor="settings-email">Email</label><input id="settings-email" className="input-field" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></div>
          <div><label className="input-label" htmlFor="settings-phone">No. Telepon</label><input id="settings-phone" className="input-field" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} /></div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Ubah Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="input-label" htmlFor="settings-current-password">Password Saat Ini</label><input id="settings-current-password" className="input-field" type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} /></div>
          <div><label className="input-label" htmlFor="settings-new-password">Password Baru</label><input id="settings-new-password" className="input-field" type="password" autoComplete="new-password" value={passwords.newPass} onChange={(event) => setPasswords((current) => ({ ...current, newPass: event.target.value }))} /></div>
          <div><label className="input-label" htmlFor="settings-confirm-password">Konfirmasi Password Baru</label><input id="settings-confirm-password" className="input-field" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} /></div>
        </div>
      </div>
      <button className="btn-primary" disabled={saving} onClick={() => void handleSave()}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
    </div>
  );
}
