import { expect, test } from '@playwright/test';

test('landing page memakai program aktif yang diatur Admin', async ({ page }) => {
  await page.route('**/backend-api/v1/public/schedule-slots', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [
        { day: 'Senin', times: ['14:15', '17:45'] },
        { day: 'Sabtu', times: ['09:30'] },
      ] }),
    });
  });
  await page.route('**/backend-api/v1/public/programs', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{
        id: 'robotics-starter',
        name: 'Robotics Starter',
        description: 'Belajar logika dan robotika dasar.',
        targetAge: 'Usia 8-12 tahun',
        price: 800000,
        sessionsPerWeek: 2,
        defaultPackageMonths: 3,
        billingCycleMonths: 1,
        registrationFee: 50000,
        bookFee: 0,
        discountPercent: 10,
        discountMinMonths: 3,
        levelOptions: ['Dasar'],
        levelDurationMonths: 3,
        isActive: true,
      }] }),
    });
  });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Robotics Starter/ })).toBeVisible();
  await expect(page.getByText('Belajar logika dan robotika dasar.')).toBeVisible();
  await expect(page.getByText('Total paket 3 bulan', { exact: true })).toBeVisible();
  await expect(page.getByText(/Setara Rp\s?720\.000\/bulan/)).toBeVisible();
  await expect(page.getByText(/Biaya awal di luar paket: Rp\s?50\.000/)).toBeVisible();
  await page.getByRole('button', { name: 'Pilih Program', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Durasi paket')).toHaveValue('3');
  await expect(dialog.getByLabel('Durasi paket').locator('option')).toHaveCount(3);
  await expect(dialog.getByLabel('Durasi paket').locator('option[value="12"]')).toHaveCount(0);
  await expect(dialog.getByText('Total paket 3 bulan', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Setara per bulan', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Harga normal', { exact: true })).toBeVisible();
  await expect(dialog.getByText('-Rp 240.000', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Rp 2.160.000', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Potongan 10%', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Biaya awal di luar paket', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/AM adalah 00\.00-11\.59, sedangkan PM adalah 12\.00-23\.59/)).toBeVisible();
  await expect(dialog.getByLabel('Senin', { exact: true })).toBeEnabled();
  await expect(dialog.getByLabel('Jam pilihan Senin').locator('option[value="14:15"]')).toHaveText('14.15 WIB (02.15 PM)');
  await expect(dialog.getByLabel('Jam pilihan Senin').locator('option[value="17:45"]')).toHaveText('17.45 WIB (05.45 PM)');
  await expect(dialog.getByLabel('Jam pilihan Sabtu').locator('option[value="09:30"]')).toHaveText('09.30 WIB (09.30 AM)');
  await expect(dialog.getByLabel('Selasa', { exact: true })).toBeDisabled();
});

test('daftar program diperbarui saat Admin menambah atau menghapus program', async ({ page }) => {
  let activePrograms = [{
    id: 'program-lama', name: 'Program Lama', price: 400000, sessionsPerWeek: 2,
    defaultPackageMonths: 2, billingCycleMonths: 2, isActive: true,
  }];
  await page.route('**/backend-api/v1/public/programs', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: activePrograms }) });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Program Lama/ })).toBeVisible();

  activePrograms = [{
    id: 'program-baru', name: 'Program Baru', price: 650000, sessionsPerWeek: 3,
    defaultPackageMonths: 2, billingCycleMonths: 2, isActive: true,
  }];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  await expect(page.getByRole('button', { name: /Program Baru/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Program Lama/ })).toHaveCount(0);
});

test('landing page mengirim formulir calon murid tanpa membuat akun orang tua', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/backend-api/v1/public/schedule-slots', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ day: 'Senin', times: ['15:00', '17:45'] }] }),
    });
  });
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
  await expect(page.locator('header').getByRole('link', { name: 'Portal Admin' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Portal Guru' })).toBeVisible();
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
