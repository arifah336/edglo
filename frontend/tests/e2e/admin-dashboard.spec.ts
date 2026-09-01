import { expect, test, type Page } from '@playwright/test';

const authSessions = new Map<string, string>();

async function login(page: Page, email = 'superadmin@edglo.id') {
  const cachedSession = authSessions.get(email);
  if (cachedSession) {
    await page.addInitScript((session) => localStorage.setItem('edglo-auth', session), cachedSession);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15_000 });
    return;
  }

  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15_000 });
  authSessions.set(email, await page.evaluate(() => localStorage.getItem('edglo-auth') ?? ''));
}

test('data backend baru dimuat setelah login berhasil', async ({ page }) => {
  let bootstrapRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/backend-api/v1/bootstrap')) bootstrapRequests += 1;
  });

  await page.goto('/');
  await expect(page.getByText('Masuk ke Dashboard', { exact: true })).toBeVisible();
  expect(bootstrapRequests).toBe(0);

  await page.getByLabel('Email').fill('superadmin@edglo.id');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15_000 });
  expect(bootstrapRequests).toBe(1);
  authSessions.set('superadmin@edglo.id', await page.evaluate(() => localStorage.getItem('edglo-auth') ?? ''));
});

test('super admin dapat login dan memakai kontrol layout', async ({ page }) => {
  await login(page);

  await page.locator('.chart-hit-zone').nth(2).hover();
  await expect(page.locator('.revenue-chart-tooltip')).toBeVisible();
  await expect(page.getByText('Pemasukan diterima', { exact: true })).toBeVisible();
  await expect(page.getByText('Pembayaran lunas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1 Tahun', exact: true }).click();
  await expect(page.locator('.chart-hit-zone')).toHaveCount(12);
  await page.getByLabel('Tahun grafik').selectOption('2025');
  await expect(page.getByText('Januari - Desember 2025', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Insight Keuangan', exact: true })).toBeVisible();
  await expect(page.getByText('Kesehatan penagihan', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Ganti tema putih atau hitam' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Perkecil sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Perbesar sidebar' })).toBeVisible();
});

test('refresh sesi aktif tidak menampilkan halaman login', async ({ page }) => {
  await login(page);
  await page.route('**/backend-api/v1/bootstrap', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Masuk ke Dashboard', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Menyiapkan EdGLO', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toHaveCount(0);
  await expect(page.getByText('Selamat datang kembali, Admin', { exact: true })).toBeVisible({ timeout: 15_000 });
});

test('form edit murid tidak tersangkut ketika pindah ke Status Murid', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await expect(page.getByLabel('Nama Lengkap *')).toHaveValue('Aisyah Nur Fadillah');

  await page.getByRole('button', { name: 'Status Murid', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Status Murid', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nama Lengkap *')).toHaveCount(0);
});

test('keuangan menampilkan jatuh tempo otomatis tanpa reminder manual', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Keuangan Bulanan', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Keuangan Bulanan', exact: true })).toBeVisible();
  await expect(page.getByText(/Terlambat \d+ hari/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kirim pengingat' })).toHaveCount(0);
  await expect(page.getByText('Pengingat tagihan dikirim')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lihat', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lunasi', exact: true }).first()).toBeVisible();
});

test('admin biasa tidak melihat menu Kelola Admin', async ({ page }) => {
  await login(page, 'admin@edglo.id');
  await expect(page.getByRole('button', { name: 'Kelola Admin', exact: true })).toHaveCount(0);
});

test('program dari backend dipakai oleh murid, jadwal, keuangan, laporan, dan PDF', async ({ page }) => {
  const dynamicProgramName = 'Program API Terhubung';
  await page.route('**/backend-api/v1/bootstrap', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.programs = body.data.programs.map((program: { id: string }) => program.id === 'calistung-regular'
      ? { ...program, name: dynamicProgramName, price: 654321 }
      : program);
    await route.fulfill({ response, json: body });
  });
  await login(page);

  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await expect(page.locator('.student-data-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Jadwal Belajar', exact: true }).click();
  await page.getByRole('button', { name: 'Daftar Kelas', exact: true }).click();
  await expect(page.locator('.schedule-data-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Keuangan Bulanan', exact: true }).click();
  await expect(page.locator('.finance-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '+ Buat Tagihan', exact: true }).click();
  await expect(page.getByText(dynamicProgramName).last()).toBeVisible();
  await expect(page.getByText('Rp 654.321 / bulan')).toBeVisible();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();

  await page.getByRole('button', { name: 'Laporan PDF', exact: true }).click();
  await expect(page.locator('.report-program-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Atur & Cetak', exact: true }).first().click();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Buka Pratinjau Cetak', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByText(dynamicProgramName).first()).toBeVisible();
  await popup.close();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login mobile masuk ke dashboard tanpa submit query string', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('http://127.0.0.1:3000/');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});
