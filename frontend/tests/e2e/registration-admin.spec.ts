import { expect, test } from '@playwright/test';

const registration = {
  id: 'RTEST1',
  parent: { id: 'PTEST1', name: 'Rani Pratama', email: 'rani@test.local', phone: '081234000111' },
  programId: 'calistung-regular',
  program: { id: 'calistung-regular', name: 'Calistung Regular', price: 600000, sessionsPerWeek: 3 },
  programSelections: [
    { programId: 'calistung-regular', programName: 'Calistung Regular', months: 2, sessionsPerWeek: 3, monthlyPrice: 600000 },
    { programId: 'english-regular', programName: 'English Regular', months: 1, sessionsPerWeek: 3, monthlyPrice: 500000 },
  ],
  childName: 'Nara Pratama',
  childAge: 8,
  address: 'Batam Center',
  preferredDays: ['Senin', 'Rabu', 'Jumat'],
  preferredSchedules: [{ day: 'Senin', time: '15:00' }, { day: 'Rabu', time: '16:30' }, { day: 'Jumat', time: '15:00' }],
  notes: 'Perlu pendampingan membaca.',
  status: 'pending',
  createdAt: '2026-09-23T08:00:00+07:00',
};

test('admin dapat memproses pendaftaran orang tua', async ({ page }) => {
  let workspaceStudents: unknown[] = [];
  await page.route('**/backend-api/v1/workspace', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    workspaceStudents = body.data.students;
    body.data.registrations = [registration];
    await route.fulfill({ response, json: body });
  });
  await page.route('**/backend-api/v1/students?*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: workspaceStudents }) });
  });
  await page.route('**/backend-api/v1/registrations/RTEST1/approve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { ...registration, status: 'approved', studentId: 'S001', adminNotes: 'Data lengkap.' } }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@edglo.id');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Pendaftaran Baru', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pendaftaran Baru', exact: true })).toBeVisible();
  await expect(page.getByText('Nara Pratama', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Detail', exact: true }).click();
  const detailDialog = page.getByRole('dialog', { name: 'Detail pendaftaran' });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText('Perlu pendampingan membaca.')).toBeVisible();
  await expect(detailDialog.getByText('16:30 WIB')).toBeVisible();
  await detailDialog.getByRole('button', { name: 'Setujui', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Setujui pendaftaran' })).toBeVisible();
  await page.getByLabel('Catatan (opsional)').fill('Data lengkap.');
  await page.getByRole('button', { name: 'Setujui & Buat Murid' }).click();
  await expect(page.getByText('Pendaftaran disetujui')).toBeVisible();
  await page.getByRole('button', { name: /Disetujui/ }).click();
  await page.getByRole('button', { name: 'Atur Guru & Jadwal' }).click();
  await expect(page.getByRole('heading', { name: 'Permintaan Orang Tua' })).toBeVisible();
  await expect(page.getByText('Perlu pendampingan membaca.')).toBeVisible();
  await expect(page.getByText('15:00 WIB').first()).toBeVisible();
  await expect(page.getByText('16:30 WIB')).toBeVisible();
  await page.getByRole('button', { name: 'Terapkan ke Jadwal' }).click();
  await expect(page.getByLabel('Hari jadwal 1')).toHaveValue('Senin');
  await expect(page.getByLabel('Jam jadwal 1')).toHaveValue('15.00');
  await expect(page.getByLabel('Hari jadwal 2')).toHaveValue('Rabu');
  await expect(page.getByLabel('Jam jadwal 2')).toHaveValue('16.30');
  await expect(page.getByLabel('Hari jadwal 3')).toHaveValue('Jumat');
  await expect(page.getByLabel('Jam jadwal 3')).toHaveValue('15.00');
});
