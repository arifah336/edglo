import { useState } from 'react';
import type { Admin } from '../types';
import { ADMINS as initialAdmins, TODAY } from '../data/mockData';
import { useToast } from '../components/ui/ToastProvider';
import AdminTable from '../components/admin/AdminTable';
import DataPagination from '../components/ui/DataPagination';
import AdminCredentialModal, { type AdminProfileInput } from '../components/admin/AdminCredentialModal';

export default function AdminManagement() {
  const { notify } = useToast();
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [deleteModal, setDeleteModal] = useState<Admin | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(admins.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleAdmins = admins.slice(pageStart, pageStart + pageSize);
  const openAdd = () => { setEditAdmin(null); setShowForm(true); };
  const openEdit = (admin: Admin) => { setEditAdmin(admin); setShowForm(true); };
  const handleSave = (profile: AdminProfileInput, passwordChanged: boolean) => {
    if (editAdmin) {
      setAdmins(admins.map((admin) => admin.id === editAdmin.id ? { ...admin, ...profile, hasPassword: admin.hasPassword !== false || passwordChanged, credentialsUpdatedAt: passwordChanged ? TODAY : admin.credentialsUpdatedAt } : admin));
    } else {
      setAdmins([...admins, { id: `A${String(admins.length + 1).padStart(3, '0')}`, ...profile, createdAt: TODAY, hasPassword: true, credentialsUpdatedAt: TODAY }]);
    }
    notify({ tone: 'success', title: editAdmin ? 'Admin diperbarui' : 'Admin ditambahkan', message: `${profile.name} berhasil disimpan.` });
    setShowForm(false);
  };
  const handleDelete = () => { if (!deleteModal) return; setAdmins(admins.filter((a) => a.id !== deleteModal.id)); notify({ tone: 'warning', title: 'Admin dihapus', message: `${deleteModal.name} tidak lagi memiliki akses.` }); setDeleteModal(null); };
  return (
    <div>
      <div className="page-header"><div style={{ fontSize: 13, color: '#6B7C8D' }}>{admins.length} akun terdaftar</div><button className="btn-primary" onClick={openAdd}>Tambah Admin</button></div>
      <AdminTable admins={visibleAdmins} startIndex={pageStart} onEdit={openEdit} onDelete={setDeleteModal} />
      <DataPagination totalItems={admins.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} label="admin" />
      {showForm && <AdminCredentialModal admin={editAdmin} admins={admins} onClose={() => setShowForm(false)} onSave={handleSave} />}
      {deleteModal && <div className="modal-overlay"><div className="modal-box" style={{ maxWidth: 380 }}><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Hapus Admin</div><p style={{ fontSize: 14, color: '#6B7C8D', marginBottom: 20 }}>Yakin ingin menghapus akun <strong>{deleteModal.name}</strong>?</p><div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Batal</button><button className="btn-danger" onClick={handleDelete}>Hapus</button></div></div></div>}
    </div>
  );
}
