import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email = 'superadmin@edglo.id') {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15_000 });
}

test('super admin dapat login dan memakai kontrol layout', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: 'Ganti tema putih atau hitam' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Perkecil sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Perbesar sidebar' })).toBeVisible();
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

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login mobile masuk ke dashboard tanpa submit query string', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('http://127.0.0.1:3000/');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});
