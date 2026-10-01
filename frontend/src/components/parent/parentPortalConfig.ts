import type { AcademicRequestType, CourseRegistrationStatus, PaymentStatus, ScheduleChangeReason, ScheduleChangeRequestStatus } from '../../types';

export type ParentPortalPage = 'dashboard' | 'children' | 'schedule' | 'schedule-request' | 'schedule-add' | 'program-request' | 'payments' | 'registrations';

export const parentPageMeta: Record<ParentPortalPage, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard Orang Tua', description: 'Ringkasan kegiatan belajar anak' },
  children: { title: 'Anak & Program', description: 'Data program dan pengajar anak' },
  schedule: { title: 'Jadwal Belajar', description: 'Jadwal kelas mingguan yang sedang berlaku' },
  'schedule-request': { title: 'Ubah Jadwal', description: 'Ajukan perpindahan jadwal kepada Admin' },
  'schedule-add': { title: 'Tambah Jadwal', description: 'Ajukan sesi tambahan sesuai kuota paket' },
  'program-request': { title: 'Ubah Paket', description: 'Ajukan perpindahan program belajar anak' },
  payments: { title: 'Pembayaran', description: 'Pantau tagihan dan status pembayaran' },
  registrations: { title: 'Pendaftaran', description: 'Riwayat pendaftaran kelas anak' },
};

export const registrationLabels: Record<CourseRegistrationStatus, string> = {
  pending: 'Menunggu verifikasi',
  approved: 'Disetujui',
  rejected: 'Perlu diperbaiki',
};

export const paymentLabels: Record<PaymentStatus, string> = {
  paid: 'Lunas',
  pending: 'Belum dibayar',
  overdue: 'Terlambat',
};

export const requestStatusLabels: Record<ScheduleChangeRequestStatus, string> = {
  pending: 'Menunggu Admin',
  approved: 'Jadwal diperbarui',
  rejected: 'Belum disetujui',
};

export const reasonLabels: Record<ScheduleChangeReason, string> = {
  school_conflict: 'Bentrok sekolah',
  family: 'Keperluan keluarga',
  transport: 'Kendala transportasi',
  health: 'Kondisi kesehatan',
  learning_need: 'Kebutuhan belajar',
  package_adjustment: 'Penyesuaian paket',
  other: 'Alasan lainnya',
};

export const requestTypeLabels: Record<AcademicRequestType, string> = {
  change_schedule: 'Pindah jadwal',
  add_schedule: 'Tambah jadwal',
  change_program: 'Ganti paket',
};

export const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function requestStatusClass(status: ScheduleChangeRequestStatus) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-800';
}
