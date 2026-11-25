import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = (process.env.BASE_URL || 'https://hellosadiqabad.com').replace(/\/+$/, '');
console.log(`Running public Add Business smoke checks against ${baseUrl}`);

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Kf8AAAAASUVORK5CYII=',
  'base64',
);

async function openForm(page) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await page.goto(`${baseUrl}/add-business`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      if (response && response.status() < 400) {
        await page.locator('#business-category-search').waitFor({ timeout: 45_000 });
        return;
      }
      lastError = new Error(`Add Business returned HTTP ${response?.status() ?? 'no response'}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw lastError ?? new Error('Add Business page did not load');
}

async function testViewport(browser, name, viewport, isMobile) {
  const page = await browser.newPage({ viewport, isMobile, hasTouch: isMobile });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await openForm(page);

  const selects = page.locator('select');
  assert.equal(await selects.count(), 2, 'Add Business should expose Category and Area selectors');
  const category = selects.nth(0);
  const area = selects.nth(1);
  await page.waitForFunction(() => {
    const controls = Array.from(document.querySelectorAll('select'));
    return controls.length === 2 && controls.every((control) => control.options.length > 1);
  }, null, { timeout: 45_000 });
  assert.equal(await category.inputValue(), '', 'Category must not auto-select the first option');
  assert.equal(await area.inputValue(), '', 'Area must not auto-select the first option');

  const categorySearch = page.locator('#business-category-search');
  const areaSearch = page.locator('#business-area-search');
  const firstCategory = (await category.locator('option').nth(1).textContent())?.trim() || '';
  const firstArea = (await area.locator('option').nth(1).textContent())?.trim() || '';
  assert.ok(firstCategory.length > 0, 'Category taxonomy should be loaded');
  assert.ok(firstArea.length > 0, 'Area taxonomy should be loaded');

  await categorySearch.fill(firstCategory.split(/\s+/)[0]);
  await category.selectOption({ index: 1 });
  const selectedCategory = await category.inputValue();
  await categorySearch.fill('__no_matching_category__');
  assert.equal(await category.inputValue(), selectedCategory, 'Category selection should survive filtering');
  assert.equal(await category.locator('option').count(), 2, 'Selected category should remain available when the filter has no matches');

  await areaSearch.fill(firstArea.split(/\s+/)[0]);
  await area.selectOption({ index: 1 });
  const selectedArea = await area.inputValue();
  await areaSearch.fill('__no_matching_area__');
  assert.equal(await area.inputValue(), selectedArea, 'Area selection should survive filtering');
  assert.equal(await area.locator('option').count(), 2, 'Selected area should remain available when the filter has no matches');

  const nameInput = page.getByLabel(/Business \/ Clinic Name \(English\)|کاروبار \/ کلینک کا نام \(انگریزی\)/);
  await nameInput.fill('QA Preview Check');
  const ownerEmail = page.getByLabel(/Owner Gmail Address|مالک کا Gmail/);
  await ownerEmail.fill('qa-preview@example.com');

  const previewHeading = page.getByRole('heading', { name: /Listing Preview|لسٹنگ کا پیش نظارہ/ });
  const preview = previewHeading.locator('xpath=../..');
  const previewText = await preview.innerText();
  assert.ok(previewText.includes('QA Preview Check'), 'Live preview should reflect the business name');
  assert.ok(!previewText.includes('qa-preview@example.com'), 'Owner email must not appear in the public preview');

  const consent = page.locator('input[type="checkbox"][required]');
  assert.equal(await consent.count(), 1, 'A required consent checkbox should be present');
  assert.equal(await consent.isChecked(), false, 'Consent must not be pre-checked');

  const imageInputs = page.locator('input[type="file"]');
  assert.equal(await imageInputs.count(), 2, 'Logo and cover file inputs should be present');
  await imageInputs.nth(0).setInputFiles({ name: 'qa-logo.png', mimeType: 'image/png', buffer: png });
  assert.ok((await preview.innerText()).includes('qa-logo.png'), 'Selected logo should appear in the preview');
  assert.equal(await imageInputs.nth(0).inputValue(), '', 'File input should reset so the same file can be selected again');
  await imageInputs.nth(0).setInputFiles({ name: 'qa-logo.png', mimeType: 'image/png', buffer: png });
  assert.ok((await preview.innerText()).includes('qa-logo.png'), 'The same logo file should be selectable again');

  const hasNoHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  assert.ok(hasNoHorizontalOverflow, `${name} layout should not overflow horizontally`);

  console.log(`PASS ${name}: taxonomy search, no auto-selection, preview privacy, consent, image retry and responsive width`);
  if (pageErrors.length) console.log(`INFO ${name}: browser page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await testViewport(browser, 'mobile', { width: 390, height: 844 }, true);
  await testViewport(browser, 'desktop', { width: 1365, height: 900 }, false);
} finally {
  await browser.close();
}
