import { chromium } from 'playwright';

async function runE2eTests() {
  console.log('Starting Playwright Navigation E2E tests...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const errors: string[] = [];
  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      console.error(`FAIL: ${message}`);
      errors.push(message);
    } else {
      console.log(`PASS: ${message}`);
    }
  };

  try {
    // 1. Initial page load
    console.log('\n--- Test 1: Initial Page Load ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const initialScrollY = await page.evaluate(() => window.scrollY);
    assert(initialScrollY === 0, `Initial scrollY should be 0 (got ${initialScrollY})`);

    // 2. Single click on a different section (Neuron) from Introduction
    console.log('\n--- Test 2: Single click to different section (The Neuron) ---');
    const neuronLink = page.locator('aside nav a[href="#the-neuron"]');
    await neuronLink.click();
    // Wait for scroll to settle
    await page.waitForTimeout(1400);

    const neuronScrollY = await page.evaluate(() => window.scrollY);
    const neuronRectTop = await page.evaluate(() => {
      const el = document.getElementById('the-neuron');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    const hashAfterNeuron = await page.evaluate(() => window.location.hash);

    assert(neuronScrollY > 400, `Page scrolled on FIRST click to Neuron (scrollY=${neuronScrollY})`);
    assert(
      neuronRectTop !== null && Math.abs(neuronRectTop - 96) <= 5,
      `Neuron section aligned with top offset (rect.top=${neuronRectTop}, expected ~96)`
    );
    assert(hashAfterNeuron === '#the-neuron', `Hash updated to #the-neuron (got ${hashAfterNeuron})`);

    // 3. Single click on a subsection of a DIFFERENT section (e.g. gradient-descent--foggy-hill)
    console.log('\n--- Test 3: Single click to subsection of a DIFFERENT section ---');
    // Hover over Gradient Descent in sidebar to ensure subsection list is visible if needed
    const gdSection = page.locator('aside nav li', { hasText: 'Gradient Descent' }).first();
    await gdSection.hover();
    await page.waitForTimeout(300);

    const gdSubLink = page.locator('aside nav a[href="#gradient-descent--learning-rate-lab"]');
    await gdSubLink.click();
    await page.waitForTimeout(1400);

    const gdSubScrollY = await page.evaluate(() => window.scrollY);
    const gdSubRectTop = await page.evaluate(() => {
      const el = document.getElementById('gradient-descent--learning-rate-lab');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    const hashAfterGdSub = await page.evaluate(() => window.location.hash);

    assert(gdSubScrollY > neuronScrollY, `Page scrolled down further on FIRST click to GD subsection (scrollY=${gdSubScrollY})`);
    assert(
      gdSubRectTop !== null && Math.abs(gdSubRectTop - 96) <= 5,
      `GD subsection aligned with top offset (rect.top=${gdSubRectTop}, expected ~96)`
    );
    assert(
      hashAfterGdSub === '#gradient-descent--learning-rate-lab',
      `Hash updated to #gradient-descent--learning-rate-lab (got ${hashAfterGdSub})`
    );

    // 4. Single click to subsection within CURRENT section
    console.log('\n--- Test 4: Single click to subsection within current section ---');
    const gdSubLink2 = page.locator('aside nav a[href="#gradient-descent--2d-contour"]');
    await gdSubLink2.click();
    await page.waitForTimeout(1400);

    const gdSub2RectTop = await page.evaluate(() => {
      const el = document.getElementById('gradient-descent--2d-contour');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    assert(
      gdSub2RectTop !== null && Math.abs(gdSub2RectTop - 96) <= 5,
      `Second subsection in same section aligned with top offset on FIRST click (rect.top=${gdSub2RectTop}, expected ~96)`
    );

    // 5. Scroll to top via top-left heading
    console.log('\n--- Test 5: Scroll to top via logo/heading ---');
    const topHeadingLink = page.locator('aside a[href="#"]').first();
    await topHeadingLink.click();
    await page.waitForTimeout(1400);

    const topScrollY = await page.evaluate(() => window.scrollY);
    assert(topScrollY === 0, `Scrolled back to top 0 (got ${topScrollY})`);

    // 6. Mobile drawer test
    console.log('\n--- Test 6: Mobile drawer single-click navigation ---');
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem('dismissed_desktop_notice', 'true');
    });
    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    // Open mobile menu
    const menuButton = mobilePage.locator('header button[aria-label="Open menu"]');
    await menuButton.click();
    await mobilePage.waitForTimeout(400);

    // Click Neuron section in mobile menu
    const mobileNeuronLink = mobilePage.locator('aside.lg\\:hidden nav a[href="#the-neuron"]');
    await mobileNeuronLink.click();
    await mobilePage.waitForTimeout(1400);

    const mobileScrollY = await mobilePage.evaluate(() => window.scrollY);
    const mobileNeuronRectTop = await mobilePage.evaluate(() => {
      const el = document.getElementById('the-neuron');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    assert(mobileScrollY > 400, `Mobile page scrolled on FIRST click from drawer (scrollY=${mobileScrollY})`);
    assert(
      mobileNeuronRectTop !== null && Math.abs(mobileNeuronRectTop - 96) <= 5,
      `Mobile section aligned with top offset (rect.top=${mobileNeuronRectTop}, expected ~96)`
    );

    // 7. Hash on page load
    console.log('\n--- Test 7: Hash on initial page load ---');
    const hashPage = await context.newPage();
    await hashPage.goto('http://localhost:5173/#backpropagation', { waitUntil: 'networkidle' });
    await hashPage.waitForTimeout(1000);

    const debugInfo = await hashPage.evaluate(() => {
      const el = document.getElementById('backpropagation');
      return {
        scrollY: window.scrollY,
        pageYOffset: window.pageYOffset,
        docScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop,
        elRectTop: el ? Math.round(el.getBoundingClientRect().top) : null,
        elOffsetTop: (el as HTMLElement)?.offsetTop ?? null,
      };
    });
    const hashPageScrollY = debugInfo.scrollY || debugInfo.docScrollTop;
    const hashRectTop = debugInfo.elRectTop;
    assert(hashPageScrollY > 1000, `Page loaded with hash scrolled to backpropagation (scrollY=${hashPageScrollY})`);
    assert(
      hashRectTop !== null && Math.abs(hashRectTop - 96) <= 5,
      `Hash target aligned on page load (rect.top=${hashRectTop}, expected ~96)`
    );

    await browser.close();

    if (errors.length > 0) {
      console.error(`\nCompleted with ${errors.length} failed assertions!`);
      process.exit(1);
    } else {
      console.log('\nALL 7 NAVIGATION E2E TESTS PASSED SUCCESSFULLY ON FIRST CLICK!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    await browser.close();
    process.exit(1);
  }
}

runE2eTests();
