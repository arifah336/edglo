import { expect, test } from '@playwright/test';

const overview = {
  teacher: { id: 'T001', fullName: 'Siti Rahmawati, S.Pd', employmentType: 'fulltime' },
  summary: { activeStudents: 2, weeklySessions: 3, pointsThisMonth: 20 },
  classes: [
    { id: 'CL001', day: 'Senin', time: '15.00', room: 'Ruang 1', programName: 'Calistung Regular', capacity: 8, students: [{ id: 'S001', fullName: 'Aisyah Nur Fadillah' }] },
    { id: 'CL002', day: 'Rabu', time: '15.00', room: 'Ruang 2', programName: 'Calistung Regular', capacity: 8, students: [{ id: 'S001', fullName: 'Aisyah Nur Fadillah' }] },
  ],
  students: [{
    id: 'S001',
    fullName: 'Aisyah Nur Fadillah',
    programName: 'Calistung Regular',
    currentLevel: 'A',
    schedules: [{ day: 'Senin', time: '15.00' }, { day: 'Rabu', time: '15.00' }],
    totalPoints: 20,
    progressLogs: [{ id: '1', studentId: 'S001', activityDate: '2026-10-25', activityType: 'reading', points: 20, notes: 'Membaca mandiri.' }],
  }, {
    id: 'S002',
    fullName: 'Budi Santoso',
    programName: 'English Everyday',
    currentLevel: 'A',
    schedules: [{ day: 'Selasa', time: '16.30' }],
    totalPoints: 10,
    progressLogs: [],
  }],
};

test('portal guru memakai login terpisah dan tidak melakukan request berulang', async ({ page }) => {
  let overviewRequests = 0;
  await page.route('**/backend-api/v1/auth/teacher/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'teacher-test-token',
        tokenType: 'Bearer',
        user: { id: 10, code: 'G001', name: 'Siti Rahmawati, S.Pd', email: 'guru@test.local', role: 'teacher', isActive: true },
      }),
    });
  });
  await page.route('**/backend-api/v1/teacher/overview', async (route) => {
    overviewRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: overview }) });
  });

  await page.goto('/teacher/login');
  await expect(page.getByRole('heading', { name: 'Masuk ke Portal Guru' })).toBeVisible();
  await page.getByLabel('Email').fill('guru@test.local');
  await page.getByLabel('Password').fill('guru12345');
  await page.getByRole('button', { name: 'Masuk sebagai Guru' }).click();

  await expect(page.getByRole('heading', { name: 'Ringkasan mengajar' })).toBeVisible();
  const menuButton = page.getByRole('button', { name: 'Buka atau tutup menu' });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await menuButton.click();
  await expect(page.locator('.teacher-portal-shell')).toHaveClass(/sidebar-collapsed/);
  await menuButton.click();
  const themeButton = page.getByRole('button', { name: 'Ganti tema terang atau gelap' });
  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('edglo-theme'))).toBe('dark');
  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Buka menu profil' }).click();
  await expect(page.getByText('guru@test.local')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Keluar dari akun' })).toBeVisible();
  await page.getByRole('button', { name: 'Buka menu profil' }).click();
  await expect(page.getByRole('button', { name: /^Jadwal & Kelas/ })).toBeVisible();
  await expect(page.getByText('Perkembangan terbaru')).toBeVisible();
  await page.getByRole('button', { name: /^Jadwal & Kelas/ }).click();
  await expect(page.getByRole('heading', { name: 'Jadwal & kelas' })).toBeVisible();
  await expect(page.getByText('Ruang 1').first()).toBeVisible();
  await page.getByRole('button', { name: /^Perkembangan/ }).click();
  await expect(page.getByRole('heading', { name: 'Aisyah Nur Fadillah' })).toBeVisible();
  await expect(page.getByText('Membaca mandiri.')).toBeVisible();
  await page.waitForTimeout(800);
  expect(overviewRequests).toBe(1);
});

test('portal guru tetap rapi pada layar mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('edglo-auth', JSON.stringify({
    token: 'teacher-test-token',
    user: { id: 10, code: 'G001', name: 'Siti Rahmawati, S.Pd', email: 'guru@test.local', role: 'teacher', isActive: true },
  })));
  await page.route('**/backend-api/v1/teacher/overview', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: overview }) });
  });

  await page.goto('/teacher');
  await expect(page.getByRole('heading', { name: 'Ringkasan mengajar' })).toBeVisible();
  const menuButton = page.getByRole('button', { name: 'Buka atau tutup menu' });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: /^Jadwal & Kelas/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tutup menu navigasi' }).click({ position: { x: 380, y: 300 } });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});

test('tema gelap portal guru menjaga kontras pilihan murid dan jadwal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('edglo-theme', 'dark');
    localStorage.setItem('edglo-auth', JSON.stringify({
      token: 'teacher-test-token',
      user: { id: 10, code: 'G001', name: 'Siti Rahmawati, S.Pd', email: 'guru@test.local', role: 'teacher', isActive: true },
    }));
  });
  await page.route('**/backend-api/v1/teacher/overview', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: overview }) });
  });

  await page.goto('/teacher');
  await page.getByRole('button', { name: /^Perkembangan/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Catatan belajar' })).toBeVisible();

  const studentOptions = page.locator('.teacher-student-selector > button');
  await expect(studentOptions.nth(0)).toHaveCSS('background-color', 'rgb(25, 48, 57)');
  await expect(studentOptions.nth(0).locator('strong')).toHaveCSS('color', 'rgb(231, 238, 241)');
  await expect(studentOptions.nth(1)).toHaveCSS('background-color', 'rgb(20, 27, 32)');
  await expect(page.locator('.teacher-student-schedules strong').first()).toHaveCSS('color', 'rgb(224, 233, 236)');
});
