import { expect, test } from '@playwright/test';

test('landing page mengirim formulir calon murid tanpa membuat akun orang tua', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/backend-api/v1/registrations', async (route) => {
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Pendaftaran berhasil dikirim dan menunggu pemeriksaan Admin.',
        registration: { id: 'R0001', status: 'pending' },
      }),
    });
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'EdGLO Learning Center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Temukan ritme belajar yang paling pas.' })).toBeVisible();
  await page.getByRole('button', { name: /Konsultasi & Daftar/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Form ini tidak membuat akun.')).toBeVisible();
  await dialog.getByLabel('Nama orang tua').fill('Orang Tua Test');
  await dialog.getByLabel('Nomor WhatsApp').fill('081234567890');
  await dialog.getByLabel(/^Email/).fill('parent@test.local');
  await dialog.getByLabel('Nama anak').fill('Anak Test');
  await dialog.getByLabel('Usia anak').fill('8');
  await dialog.getByLabel('Alamat').fill('Batam Center');
  await dialog.getByRole('checkbox', { name: /^Calistung Regular/ }).check();
  await dialog.getByLabel('Durasi paket').selectOption('2');
  await dialog.getByLabel('Senin', { exact: true }).check();
  await dialog.getByLabel('Jam pilihan Senin').selectOption('15:00');
  await dialog.getByLabel('Catatan kebutuhan').fill('Bisa menyesuaikan setelah pukul 15.00.');
  await dialog.getByRole('button', { name: 'Kirim ke Admin EdGLO' }).click();

  await expect(dialog.getByRole('heading', { name: 'Data berhasil dikirim' })).toBeVisible();
  expect(submitted).toMatchObject({
    parentName: 'Orang Tua Test',
    phone: '081234567890',
    programSelections: [{ programId: 'calistung-regular', months: 2 }],
    preferredSchedules: [{ day: 'Senin', time: '15:00' }],
  });
  expect(submitted).not.toHaveProperty('password');
});

test('landing page tetap rapi pada layar mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Buka menu' }).click();
  await expect(page.locator('header').getByRole('link', { name: 'Masuk Admin' })).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'Daftar Kelas' })).toBeVisible();
  await expect(page.locator('header').getByText('Portal Orang Tua', { exact: true })).toHaveCount(0);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});

test('form pendaftaran tetap terbaca saat tema gelap tersimpan', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('edglo-theme', 'dark'));
  await page.goto('/');
  await page.getByRole('button', { name: /Konsultasi & Daftar/ }).click();

  const title = page.getByRole('heading', { name: 'Lengkapi data pendaftaran EdGLO' });
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS('color', 'rgb(0, 0, 0)');
});
