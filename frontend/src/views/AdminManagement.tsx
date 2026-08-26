import { useState } from 'react';
import type { Admin } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import AdminTable from '../components/admin/AdminTable';
import DataPagination from '../components/ui/DataPagination';
import AdminCredentialModal, { type AdminProfileInput } from '../components/admin/AdminCredentialModal';
import { api } from '../lib/api';

type Props = {
  admins: Admin[];
  token: string;
  onAdminsChange: (admins: Admin[]) => void;
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Permintaan ke server gagal.';
}

export default function AdminManagement({ admins, token, onAdminsChange }: Props) {
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [deleteModal, setDeleteModal] = useState<Admin | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(admins.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleAdmins = admins.slice(pageStart, pageStart + pageSize);

  const openAdd = () => { setEditAdmin(null); setShowForm(true); };
  const openEdit = (admin: Admin) => { setEditAdmin(admin); setShowForm(true); };

  const handleSave = async (profile: AdminProfileInput) => {
    setSaving(true);
    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || null,
        role: profile.role,
        isActive: true,
        password: profile.password,
        password_confirmation: profile.passwordConfirmation,
      };
      if (editAdmin) {
        const saved = await api.updateAdmin(token, editAdmin.id, payload);
        onAdminsChange(admins.map((admin) => admin.id === saved.id ? saved : admin));
      } else {
        onAdminsChange([...admins, await api.createAdmin(token, payload)]);
      }
      notify({ tone: 'success', title: editAdmin ? 'Admin diperbarui' : 'Admin ditambahkan', message: profile.name + ' berhasil disimpan di backend.' });
      setShowForm(false);
    } catch (error) {
      notify({ tone: 'error', title: 'Akun admin gagal disimpan', message: messageOf(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setSaving(true);
    try {
      await api.deleteAdmin(token, deleteModal.id);
      onAdminsChange(admins.filter((admin) => admin.id !== deleteModal.id));
      notify({ tone: 'warning', title: 'Admin dihapus', message: deleteModal.name + ' tidak lagi memiliki akses.' });
      setDeleteModal(null);
    } catch (error) {
      notify({ tone: 'error', title: 'Admin gagal dihapus', message: messageOf(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header"><div style={{ fontSize: 13, color: '#6B7C8D' }}>{admins.length} akun backend terdaftar</div><button className="btn-primary" onClick={openAdd}>Tambah Admin</button></div>
      <AdminTable admins={visibleAdmins} startIndex={pageStart} onEdit={openEdit} onDelete={setDeleteModal} />
      <DataPagination totalItems={admins.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="admin" />
      {showForm && <AdminCredentialModal admin={editAdmin} admins={admins} onClose={() => !saving && setShowForm(false)} onSave={handleSave} />}
      {deleteModal && <div className="modal-overlay"><div className="modal-box" style={{ maxWidth: 380 }}><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Hapus Admin</div><p style={{ fontSize: 14, color: '#6B7C8D', marginBottom: 20 }}>Yakin ingin menghapus akun <strong>{deleteModal.name}</strong>?</p><div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button className="btn-secondary" disabled={saving} onClick={() => setDeleteModal(null)}>Batal</button><button className="btn-danger" disabled={saving} onClick={() => void handleDelete()}>{saving ? 'Menghapus...' : 'Hapus'}</button></div></div></div>}
    </div>
  );
}
