import assert from 'node:assert/strict';
import { chromium, request } from 'playwright';

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

  const categoryTrigger = page.locator('#business-category-trigger');
  const areaTrigger = page.locator('#business-area-trigger');
  assert.equal(await categoryTrigger.count(), 1, 'A custom Category dropdown trigger should be present');
  assert.equal(await areaTrigger.count(), 1, 'A custom Area dropdown trigger should be present');
  assert.equal(await page.getByText(/Business category|کاروبار کی کیٹیگری/).count(), 1, 'Styled category panel heading should be visible');
  assert.equal(await page.getByText(/Business area|کاروبار کا علاقہ/).count(), 1, 'Styled area panel heading should be visible');
  assert.equal(await page.getByText(/Choose image|تصویر منتخب کریں/).count(), 2, 'Both image upload cards should show their styled choose-image action');
  assert.equal(await page.getByText(/Business images|کاروبار کی تصاویر/).count(), 1, 'Image upload section heading should be visible');

  const categorySearch = page.locator('#business-category-search');
  const areaSearch = page.locator('#business-area-search');
  await categoryTrigger.click();
  const categoryList = page.getByRole('listbox', { name: /Categories|کیٹیگریز/ });
  await categoryList.waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[role="listbox"] [role="option"]').length > 1, null, { timeout: 45_000 });
  const categoryOptions = categoryList.getByRole('option');
  assert.ok(await categoryOptions.count() > 1, 'Category taxonomy should be loaded');
  const categoryBox = await categoryList.boundingBox();
  assert.ok(categoryBox && categoryBox.height <= 230 && categoryBox.height < 0.4 * viewport.height, 'Category menu must remain a compact scrollable panel, not cover the screen');
  const firstCategory = (await categoryOptions.nth(1).innerText()).trim();
  assert.ok(firstCategory.length > 0, 'Category options should have labels');
  await categorySearch.fill(firstCategory.split(/\s+/)[0]);
  await categoryList.getByRole('option').nth(1).click();
  const selectedCategory = await categoryTrigger.innerText();
  await categorySearch.fill('__no_matching_category__');
  await categoryTrigger.click();
  await categoryList.waitFor();
  assert.equal(await categoryList.getByRole('option').count(), 1, 'Category filtering should show the empty-state option only');
  assert.ok((await categoryTrigger.innerText()).includes(selectedCategory.trim()), 'Category selection should survive filtering');
  await categoryTrigger.click();

  await areaTrigger.click();
  const areaList = page.getByRole('listbox', { name: /Areas|علاقے/ });
  await areaList.waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[role="listbox"] [role="option"]').length > 1, null, { timeout: 45_000 });
  const areaOptions = areaList.getByRole('option');
  assert.ok(await areaOptions.count() > 1, 'Area taxonomy should be loaded');
  const areaBox = await areaList.boundingBox();
  assert.ok(areaBox && areaBox.height <= 230 && areaBox.height < 0.4 * viewport.height, 'Area menu must remain a compact scrollable panel, not cover the screen');
  const firstArea = (await areaOptions.nth(1).innerText()).trim();
  assert.ok(firstArea.length > 0, 'Area options should have labels');
  await areaSearch.fill(firstArea.split(/\s+/)[0]);
  await areaList.getByRole('option').nth(1).click();
  const selectedArea = await areaTrigger.innerText();
  await areaSearch.fill('__no_matching_area__');
  await areaTrigger.click();
  await areaList.waitFor();
  assert.equal(await areaList.getByRole('option').count(), 1, 'Area filtering should show the empty-state option only');
  assert.ok((await areaTrigger.innerText()).includes(selectedArea.trim()), 'Area selection should survive filtering');
  await areaTrigger.click();

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

async function testGovernmentSharePreviews(browser) {
  const routes = [
    '/government-jobs/network-support-consultant-cga-2026',
    '/government-schemes/apni-chhat-apna-ghar',
  ];
  const api = await request.newContext();
  try {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const response = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      assert.ok(response && response.status() < 400, route + ' should render for visitors');
      assert.equal(await page.getByRole('link', { name: /WhatsApp|واٹس ایپ/ }).count(), 1, route + ' should show WhatsApp share action');
      assert.equal(await page.getByRole('link', { name: /Facebook|فیس بک/ }).count(), 1, route + ' should show Facebook share action');
      assert.equal(await page.getByRole('button', { name: /Copy link|لنک کاپی کریں/ }).count(), 1, route + ' should show canonical copy-link action');
      await page.close();

      const socialResponse = await api.get(baseUrl + route, {
        headers: { 'user-agent': 'facebookexternalhit/1.1' },
        timeout: 45_000,
      });
      assert.ok(socialResponse.ok(), route + ' social crawler request should succeed');
      const html = await socialResponse.text();
      assert.match(html, /property="og:title" content="[^"]+"/, route + ' should expose a record-specific Open Graph title');
      const expectedCanonical = 'property="og:url" content="https://hellosadiqabad.com' + route + '"';
      assert.ok(html.includes(expectedCanonical), route + ' should expose its canonical share URL');
      assert.ok(html.includes('property="og:image" content="https://'), route + ' should expose an HTTPS social preview image');
      assert.match(html, /name="twitter:card" content="summary_large_image"/, route + ' should expose a large Twitter preview');
      console.log('PASS social preview ' + route + ': canonical URL, record title and HTTPS image');
    }
  } finally {
    await api.dispose();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await testViewport(browser, 'mobile', { width: 390, height: 844 }, true);
  await testViewport(browser, 'desktop', { width: 1365, height: 900 }, false);
  await testGovernmentSharePreviews(browser);
} finally {
  await browser.close();
}
