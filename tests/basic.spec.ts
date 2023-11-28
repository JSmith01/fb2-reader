import { expect, test } from '@playwright/test';
import path = require("path");

test('has proper welcome page', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveTitle(/FB2 Reader/);

  await expect(page.locator('[id="f"]')).toBeVisible();

  await expect(page.getByRole('button', { name: 'open bookshelf' })).toBeVisible();
});

test('loads the test fb2 book and navigate through it', async ({ page }, testInfo) => {
  await page.goto('http://localhost:3000/');

  await page.locator('#f').setInputFiles(path.join(__dirname, 'test.fb2.zip'));

  await expect(page.locator('#book > *')).toHaveCount(1);

  const img = page.getByRole('img');
  await expect(img).toBeVisible();

  await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });

  const [w, h] = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  await page.mouse.click(w / 2, h - 10);

  const curPercent = page.locator('#curPercent');
  await expect(curPercent).toHaveText(/(49|50|51)\.\d+/);

  await testInfo.attach('mid-book', { body: await page.screenshot(), contentType: 'image/png' });
});

test('test bookshelf', async ({ page }, testInfo) => {
  await page.goto('http://localhost:3000/');

  await page.locator('#f').setInputFiles(path.join(__dirname, 'test.fb2.zip'));

  await expect(page.locator('#book > *')).toHaveCount(1);

  page.on('dialog', dialog => dialog.accept());
  await page.mouse.move(300, 5);
  await page.locator('#close-book').click();

  await expect(page.locator('#book > *')).toHaveCount(0);

  const bookShelfMgr = page.locator('#bookshelf-manager');
  await expect(bookShelfMgr).not.toBeVisible();
  await page.getByRole('button', { name: 'open bookshelf' }).click();
  await expect(bookShelfMgr).toBeVisible();

  const shelfRows = page.locator('#bookshelf-manager table tr');
  await expect(shelfRows).toHaveCount(1);
  const removeBookFromShelfBtn = page.locator('#bookshelf-manager table tr button');
  await expect(removeBookFromShelfBtn).toHaveCount(1);
  await testInfo.attach('bookshelf-loaded', { body: await page.screenshot(), contentType: 'image/png' });

  await removeBookFromShelfBtn.click();

  await expect(shelfRows).toHaveCount(1);
  await expect(removeBookFromShelfBtn).toHaveCount(0);
  await testInfo.attach('bookshelf-empty', { body: await page.screenshot(), contentType: 'image/png' });

  await page.getByRole('button', { name: 'Close bookshelf' }).click();

  await expect(bookShelfMgr).not.toBeVisible();

  await testInfo.attach('bookshelf-closed', { body: await page.screenshot(), contentType: 'image/png' });
});
