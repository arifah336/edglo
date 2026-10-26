import { expect, test, type Page } from '@playwright/test';

test.setTimeout(60_000);

const authSessions = new Map<string, string>();

async function login(page: Page, email = 'superadmin@edglo.id') {
  const cachedSession = authSessions.get(email);
  if (cachedSession) {
    await page.addInitScript((session) => localStorage.setItem('edglo-auth', session), cachedSession);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30_000 });
    return;
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30_000 });
  authSessions.set(email, await page.evaluate(() => localStorage.getItem('edglo-auth') ?? ''));
}

test('data backend baru dimuat setelah login berhasil', async ({ page }) => {
  let workspaceRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/backend-api/v1/workspace')) workspaceRequests += 1;
  });

  await page.goto('/login');
  await expect(page.getByText('Masuk ke Dashboard', { exact: true })).toBeVisible();
  expect(workspaceRequests).toBe(0);

  await page.getByLabel('Email').fill('superadmin@edglo.id');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30_000 });
  expect(workspaceRequests).toBe(1);
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
  await page.route('**/backend-api/v1/workspace', async (route) => {
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
  await login(page, 'admin@edglo.id');
  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await expect(page.getByLabel('Nama Lengkap *')).toHaveValue('Aisyah Nur Fadillah');

  await page.getByRole('button', { name: 'Status Murid', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Status Murid', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nama Lengkap *')).toHaveCount(0);
});

test('foto murid tampil di daftar dan langsung dipreview saat dipilih', async ({ page }) => {
  await page.route('**/backend-api/v1/workspace', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.students[0].photo = '/edglo-logo.png';
    await route.fulfill({ response, json: body });
  });
  await login(page, 'admin@edglo.id');
  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();

  const avatar = page.locator('.student-list-avatar.has-photo').first();
  await expect(avatar).toHaveAttribute('style', /edglo-logo\.png/);

  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Pilih foto murid').setInputFiles('public/edglo-students.jpg');
  await expect(page.locator('.photo-upload-preview > span')).toHaveCSS('background-image', /blob:/);
  await expect(page.getByText('edglo-students.jpg', { exact: true })).toBeVisible();
});

test('data murid dapat diurutkan berdasarkan ID, nama, dan tanggal masuk', async ({ page }) => {
  await login(page, 'admin@edglo.id');
  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();

  const ids = page.locator('.student-name-copy small');
  const defaultIds = await ids.allTextContents();
  expect(defaultIds).toEqual([...defaultIds].sort((first, second) => first.localeCompare(second, 'id', { numeric: true })));

  await page.getByLabel('Urutkan data murid').selectOption('id-desc');
  const descendingIds = await ids.allTextContents();
  expect(descendingIds).toEqual([...descendingIds].sort((first, second) => second.localeCompare(first, 'id', { numeric: true })));

  await page.getByLabel('Urutkan data murid').selectOption('name-asc');
  const names = await page.locator('.student-name-copy strong').allTextContents();
  expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second, 'id', { sensitivity: 'base' })));
});

test('keuangan menampilkan jatuh tempo otomatis tanpa reminder manual', async ({ page }) => {
  await login(page, 'admin@edglo.id');
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

test('Admin dapat membuka pengaturan harga, paket, promo, dan level program', async ({ page }) => {
  await login(page, 'admin@edglo.id');
  await page.getByRole('button', { name: 'Kelola Program', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Kelola Program', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paket belajar EdGLO', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tambah Program', exact: true }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Tambah program', exact: true })).toBeVisible();
  await dialog.getByLabel('Nama program *').fill('English Conversation');
  const priceInput = dialog.getByLabel('Harga per bulan *');
  await expect(priceInput).toHaveValue('');
  await priceInput.fill('01111111');
  await expect(priceInput).toHaveValue('1.111.111');
  await priceInput.fill('');
  await expect(priceInput).toHaveValue('');
  await priceInput.fill('750000');
  await expect(priceInput).toHaveValue('750.000');
  await priceInput.focus();
  await page.mouse.wheel(0, -300);
  await expect(priceInput).toHaveValue('750.000');
  const bookFeeInput = dialog.getByLabel('Biaya buku');
  await expect(bookFeeInput).toHaveValue('');
  await bookFeeInput.fill('0100000');
  await expect(bookFeeInput).toHaveValue('100.000');
  await dialog.getByLabel('Durasi paket awal *').fill('3');
  const discountInput = dialog.getByLabel('Diskon paket');
  await discountInput.fill('010');
  await expect(discountInput).toHaveValue('10');
  await dialog.getByLabel('Pilihan level').fill('A, B, C');
  await expect(dialog.getByText('Rp 750.000', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Rp 2.025.000', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Tampilkan di pendaftaran')).toBeChecked();

  await dialog.getByRole('button', { name: 'Batal', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Bimbel Everyday', exact: true }).click();
  const editDialog = page.getByRole('dialog');
  const registrationFeeInput = editDialog.getByLabel('Biaya pendaftaran');
  await expect(registrationFeeInput).toHaveValue('0');
  await registrationFeeInput.click();
  await page.keyboard.type('125000');
  await expect(registrationFeeInput).toHaveValue('125.000');
  const existingDiscountInput = editDialog.getByLabel('Diskon paket');
  await expect(existingDiscountInput).toHaveValue('0');
  await existingDiscountInput.click();
  await page.keyboard.type('10');
  await expect(existingDiscountInput).toHaveValue('10');
});

test('Admin fokus pada pendaftaran baru tanpa kotak masuk portal orang tua', async ({ page }) => {
  await login(page, 'admin@edglo.id');
  await expect(page.getByRole('button', { name: 'Pendaftaran Baru', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Permintaan Jadwal', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pengajuan Akademik', exact: true })).toHaveCount(0);
});

test('program dari backend dipakai oleh murid, jadwal, keuangan, laporan, dan PDF', async ({ page }) => {
  const dynamicProgramName = 'Program API Terhubung';
  await page.route('**/backend-api/v1/workspace', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.programs = body.data.programs.map((program: { id: string }) => program.id === 'calistung-regular'
      ? { ...program, name: dynamicProgramName, price: 654321 }
      : program);
    body.data.students = body.data.students.map((student: { programId: string }) => student.programId === 'calistung-regular'
      ? { ...student, billingAmount: 1234567, billingCycleMonths: 2 }
      : student);
    await route.fulfill({ response, json: body });
  });
  await login(page, 'admin@edglo.id');

  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await expect(page.locator('.student-data-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Jadwal Belajar', exact: true }).click();
  await page.getByRole('button', { name: 'Daftar Kelas', exact: true }).click();
  await expect(page.locator('.schedule-data-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Keuangan Bulanan', exact: true }).click();
  await expect(page.locator('.finance-table').getByText(dynamicProgramName, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '+ Buat Tagihan', exact: true }).click();
  await expect(page.getByText(dynamicProgramName).last()).toBeVisible();
  await expect(page.getByText('Rp 1.234.567 / 2 bulan')).toBeVisible();
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

test('menu dan aksi Super Admin mengikuti batas operasional', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('button', { name: 'Slip Gaji Guru', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pendaftaran Online', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Keuangan Bulanan', exact: true }).click();
  await expect(page.getByRole('button', { name: '+ Buat Tagihan', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lunasi', exact: true })).toHaveCount(0);

});

test('Admin memperoleh form murid lengkap dan modul operasional', async ({ page }) => {
  await login(page, 'admin@edglo.id');
  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah Murid', exact: true }).click();
  await expect(page.getByText('Foto murid', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tempat Lahir', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tanggal Lahir', { exact: true })).toBeVisible();
  await page.locator('.entity-form-card select').first().selectOption('calistung-regular');
  await expect(page.locator('label').filter({ hasText: 'Level saat ini' }).locator('select')).toBeVisible();
  await expect(page.getByLabel('Biaya daftar', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Biaya buku', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Biaya lainnya', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Potongan promo', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nominal paket *', { exact: true })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Ditagih setiap' }).locator('select')).toHaveValue('2');

  await page.getByRole('button', { name: 'Data Guru', exact: true }).click();
  await expect(page.getByRole('button', { name: '+ Tambah Guru', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lihat Status', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Absensi Murid & Pengganti', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Absensi & Pengganti', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Absensi Guru', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Murid Tidak Hadir', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jadwal Pengganti', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slip Gaji Guru', exact: true })).toHaveCount(0);
});

test('Super Admin mengelola guru dan slip gaji dalam mode baca untuk operasional Admin', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Data Guru', exact: true }).click();
  await expect(page.getByRole('button', { name: '+ Tambah Guru', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kelola Status', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Data Murid', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tambah Murid', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Absensi Guru', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Simpan', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Murid Tidak Hadir', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Slip Gaji Guru', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Slip Gaji Guru', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Slip gaji berbasis kehadiran', exact: true })).toBeVisible();
});

test('Super Admin dapat menambah guru beserta akun portal meski urutan ID guru tidak rapat', async ({ page }) => {
  let createRequests = 0;
  await page.route('**/backend-api/v1/workspace', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.teachers = body.data.teachers.slice(0, 2).map((teacher: { id: string }, index: number) => ({ ...teacher, id: index === 0 ? 'T001' : 'T003' }));
    await route.fulfill({ response, json: body });
  });
  await page.route('**/backend-api/v1/teachers', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    createRequests += 1;
    expect(route.request().postData()).toContain('portalPassword');
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ data: {
        id: 'T004', fullName: 'Guru Portal Test', address: 'Batam Center', birthPlace: 'Batam', birthDate: '1997-05-10',
        religion: 'Islam', email: 'guru.portal.test@edglo.id', phone: '081234567899', lastEducation: 'S1', joinDate: '2026-10-25',
        employmentType: 'fulltime', status: 'active', activeStudents: 0, hasPortalAccount: true, portalActive: true,
        statusHistory: [{ date: '2026-10-25', action: 'activated', by: 'Super Admin EdGLO' }],
      } }),
    });
  });

  await login(page);
  await page.getByRole('button', { name: 'Data Guru', exact: true }).click();
  await page.getByRole('button', { name: '+ Tambah Guru', exact: true }).click();
  await page.getByLabel('Nama Lengkap *').fill('Guru Portal Test');
  await page.getByLabel('Alamat *').fill('Batam Center');
  await page.getByLabel('Tempat Lahir').fill('Batam');
  await page.getByLabel('Tanggal Lahir').fill('1997-05-10');
  await page.getByLabel('Email', { exact: true }).fill('guru.portal.test@edglo.id');
  await page.getByLabel('No. Telepon *').fill('081234567899');
  await page.getByLabel('Tanggal Masuk *').fill('2026-10-25');
  const password = page.getByLabel('Password awal *');
  await password.fill('guru12345');
  await page.getByRole('button', { name: 'Tampilkan sandi guru' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();

  await expect(page.getByText('Guru Portal Test', { exact: true }).first()).toBeVisible();
  expect(createRequests).toBe(1);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login mobile masuk ke dashboard tanpa submit query string', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});
