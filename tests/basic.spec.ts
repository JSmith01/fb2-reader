import { test, expect } from '@playwright/test';
import path = require("path");

test('has proper welcome page', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveTitle(/FB2 Reader/);

  await expect(page.locator('[id="f"]')).toBeVisible();

  await expect(page.getByRole('button', { name: 'open bookshelf' })).toBeVisible();
});

test('loads the test fb2 book', async ({ page }, testInfo) => {
  await page.goto('http://localhost:3000/');

  await page.locator('#f').setInputFiles(path.join(__dirname, 'test.fb2.zip'));

  await expect(page.locator('#book > *')).toHaveCount(1);

  const img = page.getByRole('img');
  await expect(img).toBeVisible();

  const screenshot = await page.screenshot();
  await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
});
