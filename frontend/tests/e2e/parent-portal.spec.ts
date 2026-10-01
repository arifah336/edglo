import { expect, test } from '@playwright/test';

test('halaman portal orang tua dialihkan ke beranda', async ({ page }) => {
  await page.goto('/parent');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'EdGLO Learning Center' })).toBeVisible();
});

test('login orang tua tidak lagi tersedia di navigasi publik', async ({ page }) => {
  await page.goto('/parent/login');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Portal Orang Tua', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Masuk Admin' }).first()).toBeVisible();
});
