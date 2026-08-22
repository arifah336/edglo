import { useState } from 'react';

import { useToast } from '../components/ui/ToastProvider';

export default function Settings() {
  const { notify } = useToast();
  const [profile, setProfile] = useState({ name: 'Super Admin EdGLO', email: 'superadmin@edglo.id', phone: '08111222333' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); notify({ tone: 'success', title: 'Pengaturan disimpan', message: 'Profil dan pengaturan akun berhasil diperbarui.' }); setTimeout(() => setSaved(false), 2500); };
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 20 }}><div className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Profil Akun</div><div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2F7884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, color: 'white' }}>{profile.name.charAt(0)}</div><div><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#1F2933' }}>{profile.name}</div><span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace', background: '#EEF7F8', color: '#2F7884', padding: '2px 10px', borderRadius: 20 }}>Super Admin</span></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div><label className="input-label">Nama Lengkap</label><input className="input-field" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div><div><label className="input-label">Email</label><input className="input-field" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div><div><label className="input-label">No. Telepon</label><input className="input-field" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div></div></div>
      <div className="card" style={{ marginBottom: 20 }}><div className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Ubah Password</div><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div><label className="input-label">Password Saat Ini</label><input className="input-field" type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} /></div><div><label className="input-label">Password Baru</label><input className="input-field" type="password" value={passwords.newPass} onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} /></div><div><label className="input-label">Konfirmasi Password Baru</label><input className="input-field" type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} /></div></div></div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><button className="btn-primary" onClick={handleSave}>Simpan Perubahan</button>{saved && <div style={{ fontSize: 13, fontWeight: 700, color: '#1A8C60' }}>Tersimpan!</div>}</div>
    </div>
  );
}
