import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function runE2eTests() {
  console.log('Starting Iteration 8B Playwright E2E verification...');
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
    const BASE_URL = 'http://localhost:5173';

    // -------------------------------------------------------------
    // Test 1: Home page loads, model ready status badge, H1
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Home Page Load & Model Status ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const homeTitle = await page.title();
    assert(
      homeTitle === 'Neural Network From Scratch',
      `Home title should be "Neural Network From Scratch" (got "${homeTitle}")`
    );

    const homeH1 = await page.locator('h1').textContent();
    assert(
      homeH1?.includes('Draw a digit. Watch the network decide.') === true,
      `Home H1 matches brief (got "${homeH1}")`
    );

    // Check header has no model badge (clean and consistent across pages)
    const headerStatusBadge = page.locator('header [role="status"]');
    assert(
      (await headerStatusBadge.count()) === 0,
      'TopBar header does not contain model status badge (consistent with docs)'
    );

    // Check status badge beside the Prediction heading in Prediction Card
    const predictionBadge = page.locator('div:has(> h2:has-text("Prediction")) [role="status"]').first();
    await predictionBadge.waitFor({ state: 'visible', timeout: 5000 });
    const badgeText = await predictionBadge.textContent();
    assert(
      badgeText?.includes('Model ready') === true,
      `Status badge beside Prediction heading displays "Model ready" (got "${badgeText}")`
    );

    // -------------------------------------------------------------
    // Test 2: Idle State (no fake 50/50 prediction)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Idle State Initial Rendering ---');
    const idlePrompt = page.locator('text=Draw a 0 or a 1 to start.').first();
    assert(
      (await idlePrompt.count()) > 0,
      'Idle prompt "Draw a 0 or a 1 to start." is displayed'
    );

    const digitDisplay = page.locator('[aria-label="No digit drawn yet"]').first();
    assert(
      (await digitDisplay.count()) > 0,
      'Digit display shows placeholder "—" when canvas is empty'
    );

    // -------------------------------------------------------------
    // Test 3: Sample buttons (True 0 & True 1) & label comparison
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Presets & True Label Comparison ---');
    // Click sample 0A
    const sample0Btn = page.locator('button', { hasText: 'True 0 (Sample A)' });
    await sample0Btn.click();
    await page.waitForTimeout(300);

    const sample0Result = page.locator('text=True label: 0. The model said: 0.');
    assert(
      (await sample0Result.count()) > 0,
      'Sample 0A correctly recognized as digit 0 with true-label feedback'
    );

    // Click sample 1A
    const sample1Btn = page.locator('button', { hasText: 'True 1 (Sample A)' });
    await sample1Btn.click();
    await page.waitForTimeout(300);

    const sample1Result = page.locator('text=True label: 1. The model said: 1.');
    assert(
      (await sample1Result.count()) > 0,
      'Sample 1A correctly recognized as digit 1 with true-label feedback'
    );

    // -------------------------------------------------------------
    // Test 4: Interactive Drawing with Pointer Events
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Drawing on Canvas with Pointer ---');
    const clearBtn = page.locator('button[aria-label="Clear drawing canvas"]');
    await clearBtn.click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas[role="img"]');
    const canvasBox = await canvas.boundingBox();
    assert(canvasBox !== null, 'Drawing canvas bounding box found');

    if (canvasBox) {
      // Draw a vertical stroke representing a '1'
      const startX = canvasBox.x + canvasBox.width * 0.5;
      const startY = canvasBox.y + canvasBox.height * 0.2;
      const endY = canvasBox.y + canvasBox.height * 0.8;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, endY, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Verify that prediction updated
      const rawOutputText = await page.locator('text=/Raw output: [0-9.]+/').first().textContent();
      assert(
        rawOutputText !== null,
        `Drawing stroke triggered live inference (got "${rawOutputText}")`
      );

      // Verify polite live region received announcement
      const liveRegion = page.locator('#digit-classifier-live-announcer');
      const liveText = await liveRegion.textContent();
      assert(
        liveText?.includes('Predicted digit') === true,
        `Polite live region announced stroke result (got "${liveText}")`
      );
    }

    // -------------------------------------------------------------
    // Test 5: "C" Keyboard Shortcut
    // -------------------------------------------------------------
    console.log('\n--- Test 5: "C" Keyboard Shortcut ---');
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(200);

    const idleAfterKey = page.locator('text=Draw a 0 or a 1 to start.').first();
    assert(
      (await idleAfterKey.count()) > 0,
      'Pressing "C" cleared the canvas and returned to idle state'
    );

    // -------------------------------------------------------------
    // Test 6: Canvas Snapshot Persistence across Navigation
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Canvas Snapshot Persistence Across Routes ---');
    // Click sample 1b so we have a known state
    const sample1bBtn = page.locator('button', { hasText: 'True 1 (Sample B)' });
    await sample1bBtn.click();
    await page.waitForTimeout(300);

    // Navigate to docs
    const docsLink = page.locator('header nav a[href="/docs"]');
    await docsLink.click();
    await page.waitForURL((url) => url.pathname === '/docs');
    await page.waitForTimeout(600);
    assert(page.url().endsWith('/docs'), 'Navigated to /docs');

    // Return to Home via "Back to demo" or Header Home link
    const backToDemo = page.locator('aside nav a', { hasText: 'Back to demo' }).first();
    await backToDemo.click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.waitForTimeout(600);

    const persistedLabel = page.locator('text=True label: 1. The model said: 1.');
    await persistedLabel.waitFor({ timeout: 5000 });
    assert(
      (await persistedLabel.count()) > 0,
      'State and prediction persisted after returning from /docs'
    );

    // -------------------------------------------------------------
    // Test 7: Custom Weights Upload & Inline Validation Error
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Custom Weights Upload & Inline Error ---');
    const insideModelHeader = page.locator('text=Inside the model').first();
    assert(
      (await insideModelHeader.count()) > 0,
      '"Inside the model" section is visible as a static section'
    );

    // Create a temporary invalid weights file
    const invalidWeightsPath = path.join(process.cwd(), 'scratch_invalid_weights.json');
    fs.writeFileSync(invalidWeightsPath, JSON.stringify({ invalid: true, foo: 'bar' }));

    // Set input files
    const fileInput = page.locator('#custom-weights-input');
    await fileInput.setInputFiles(invalidWeightsPath);

    // Wait for inline error alert to appear (no window.alert!)
    const inlineAlert = page.locator('[role="alert"]');
    await inlineAlert.waitFor({ timeout: 5000 });
    assert(
      (await inlineAlert.count()) > 0,
      'Inline error alert is shown for invalid weights without window.alert'
    );
    const alertMsg = await inlineAlert.textContent();
    assert(
      alertMsg?.toLowerCase().includes('layers') === true ||
        alertMsg?.toLowerCase().includes('weights') === true,
      `Inline error message is clear and descriptive (got "${alertMsg}")`
    );

    // Clean up temporary file
    if (fs.existsSync(invalidWeightsPath)) {
      fs.unlinkSync(invalidWeightsPath);
    }
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // Test 8: Mobile 360x640 Viewport - Drawing & Prediction Visible
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Mobile Viewport 360x640 Usability ---');
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const hasHorizontalOverflowMobile = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(
      !hasHorizontalOverflowMobile,
      'No horizontal overflow on 360x640 mobile screen'
    );

    // Check that canvas and compact prediction are visible without scrolling
    const mobileCanvasVisible = await page.locator('canvas[role="img"]').isVisible();
    assert(mobileCanvasVisible, 'Drawing canvas is visible in mobile viewport');

    // Check sample buttons meet touch target size >= 40px
    const sampleBtnBoxes = await page.locator('button', { hasText: 'True 0 (Sample A)' }).boundingBox();
    assert(
      sampleBtnBoxes !== null && sampleBtnBoxes.height >= 40,
      `Sample button touch target height >= 40px (got ${sampleBtnBoxes?.height}px)`
    );

    // -------------------------------------------------------------
    // Test 9: Horizontal Overflow across Widths (360, 768, 1024, 1440)
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Horizontal Overflow Check across Widths ---');
    const widths = [360, 768, 1024, 1440];
    const testRoutes = ['/', '/docs', '/not-found-page-route'];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      for (const route of testRoutes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        assert(
          !hasHorizontalOverflow,
          `No horizontal scroll at ${width}px on route "${route}"`
        );
      }
    }

    // -------------------------------------------------------------
    // Test 10: Learn How It Works Deep Links navigate to Docs sections
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Learn How It Works Deep Links to Docs ---');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // 1. Forward Propagation link
    await page.locator('a[href="/docs#forward-propagation"]').click();
    await page.waitForURL((url) => url.hash === '#forward-propagation');
    await page.waitForTimeout(800);
    assert(
      page.url().includes('/docs#forward-propagation'),
      `Navigated to Forward Propagation (URL: ${page.url()})`
    );
    const fpActive = await page.evaluate(() => {
      const active = document.querySelector('aside [aria-current="location"]');
      return active?.textContent?.includes('Forward Propagation') === true;
    });
    assert(fpActive, 'Sidebar highlights Forward Propagation section');

    // 2. Return to Home and click How It Learned (gradient-descent)
    await page.locator('aside nav a', { hasText: 'Back to demo' }).first().click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.waitForTimeout(400);

    await page.locator('a[href="/docs#gradient-descent"]').click();
    await page.waitForURL((url) => url.hash === '#gradient-descent');
    await page.waitForTimeout(800);
    assert(
      page.url().includes('/docs#gradient-descent'),
      `Navigated to Gradient Descent (URL: ${page.url()})`
    );
    const gdActive = await page.evaluate(() => {
      const active = document.querySelector('aside [aria-current="location"]');
      return active?.textContent?.includes('Gradient Descent') === true;
    });
    assert(gdActive, 'Sidebar highlights Gradient Descent section');

    // 3. Return to Home and click Train Your Own Model (playground)
    await page.locator('aside nav a', { hasText: 'Back to demo' }).first().click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.waitForTimeout(400);

    await page.locator('a[href="/docs#train-your-own-model"]').click();
    await page.waitForURL((url) => url.hash === '#train-your-own-model');
    await page.waitForTimeout(800);
    assert(
      page.url().includes('/docs#train-your-own-model'),
      `Navigated to Train Your Own Model (URL: ${page.url()})`
    );
    const trainActive = await page.evaluate(() => {
      const active = document.querySelector('aside [aria-current="location"]');
      return active?.textContent?.includes('Train Your Own Model') === true;
    });
    assert(trainActive, 'Sidebar highlights Train Your Own Model section');

    // -------------------------------------------------------------
    // Test 11: Home Layout Structure & Alignment Check
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Home Layout Structure & Alignment Check ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify Prediction header alignment (H2 left, status badge right)
    const predH2Box = await page.locator('div:has(> h2:has-text("Prediction")) h2').first().boundingBox();
    const predBadgeBox = await page.locator('div:has(> h2:has-text("Prediction")) [role="status"]').first().boundingBox();
    assert(predH2Box !== null && predBadgeBox !== null, 'Found Prediction H2 and status badge');
    if (predH2Box && predBadgeBox) {
      assert(
        predBadgeBox.x > predH2Box.x,
        `Status badge (x=${predBadgeBox.x}) is positioned to the right of Prediction header (x=${predH2Box.x})`
      );
    }

    // Verify Row 2 ("What the network sees" & "Try real examples") is separate below Draw card
    const drawCard = page.locator('div:has(> div > h2:has-text("Draw"))').first();
    const networkSeesSection = page.locator('text=What the network sees').first();
    const drawBox = await drawCard.boundingBox();
    const networkSeesBox = await networkSeesSection.boundingBox();
    assert(drawBox !== null && networkSeesBox !== null, 'Found Draw card and Network Sees section');
    if (drawBox && networkSeesBox) {
      assert(
        networkSeesBox.y >= drawBox.y + drawBox.height - 20,
        `"What the network sees" row is located below the Draw card (Row 2)`
      );
    }

    // Verify Row 3 ("Inside the model") is located below Row 2
    const insideHeaderRow3 = page.locator('text=Inside the model').first();
    const insideBox = await insideHeaderRow3.boundingBox();
    assert(insideBox !== null, 'Found "Inside the model" header');
    if (insideBox && networkSeesBox) {
      assert(
        insideBox.y > networkSeesBox.y,
        `"Inside the model" is located below Row 2 (Row 3)`
      );
    }

    // Verify 400 -> 25 -> 15 -> 1 pill was removed from header
    const archPill = page.locator('header', { hasText: '400 → 25 → 15 → 1' });
    assert((await archPill.count()) === 0, '400 → 25 → 15 → 1 pill removed from header');

    // Verify "Use your own weights" and "Layers & Activations" have consistent height
    const insideGrid = page.locator('div:has(> div > h2:has-text("Inside the model"))').locator('div.grid').first();
    const columns = insideGrid.locator('> div');
    const layersBox = await columns.nth(0).boundingBox();
    const weightsBox = await columns.nth(1).boundingBox();
    assert(layersBox !== null && weightsBox !== null, 'Found columns in "Inside the model" grid');
    if (layersBox && weightsBox) {
      const heightDiff = Math.abs(layersBox.height - weightsBox.height);
      assert(
        heightDiff <= 2,
        `Inside the model columns have consistent height (layers=${layersBox.height}px, weights=${weightsBox.height}px)`
      );
    }

    // Verify line after "Draw a digit" heading is removed on Home page
    const homeHeaderEl = page.locator('main header');
    const hasHeaderBorder = await homeHeaderEl.evaluate((el) => {
      const cls = el.className || '';
      return cls.includes('border-b');
    });
    assert(!hasHeaderBorder, 'Horizontal line after "Draw a digit" heading was removed');

    // Verify header bottom divider line (TopBar vs Sidebar) vertical alignment matches exactly
    const topBarBox = await page.locator('header.sticky').boundingBox();
    await page.goto(`${BASE_URL}/docs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const sidebarHeaderBox = await page.locator('aside > div.border-b').boundingBox();
    assert(topBarBox !== null && sidebarHeaderBox !== null, 'Found TopBar on Home and Sidebar header on Docs');
    if (topBarBox && sidebarHeaderBox) {
      const homeLineY = topBarBox.y + topBarBox.height;
      const docsLineY = sidebarHeaderBox.y + sidebarHeaderBox.height;
      const lineDiff = Math.abs(homeLineY - docsLineY);
      assert(
        lineDiff <= 1,
        `Header divider line vertical position matches between TopBar and Sidebar (home=${homeLineY.toFixed(1)}px, docs=${docsLineY.toFixed(1)}px, diff=${lineDiff.toFixed(2)}px)`
      );
    }

    // Verify spacing between last section and footer is tuned down on Docs
    const playgroundSec = page.locator('#train-your-own-model');
    const docsFooter = page.locator('main footer');
    const playBox = await playgroundSec.boundingBox();
    const footerBox = await docsFooter.boundingBox();
    if (playBox && footerBox) {
      const gap = footerBox.y - (playBox.y + playBox.height);
      assert(gap <= 60, `Spacing between "Train your own model" and footer is tuned down (got ${gap.toFixed(1)}px <= 60px)`);
    }

    // -------------------------------------------------------------
    // Test 12: Page Animation Played Once; Subsequent Navigation Instant
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Single Entrance Animation per Session ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const homeOpacity = await page.evaluate(() => {
      const mainEl = document.querySelector('main');
      return mainEl ? window.getComputedStyle(mainEl).opacity : '1';
    });
    assert(homeOpacity === '1', 'Home page renders with opacity 1 immediately on revisit');

    const docsNav = page.locator('header nav a[href="/docs"]');
    await docsNav.click();
    await page.waitForURL((url) => url.pathname === '/docs');
    const docsOpacity = await page.evaluate(() => {
      const mainEl = document.querySelector('main');
      return mainEl ? window.getComputedStyle(mainEl).opacity : '1';
    });
    assert(docsOpacity === '1', 'Docs page renders with opacity 1 immediately on revisit');

    // -------------------------------------------------------------
    // Test 13: Footer Consistency & Sidebar Cleanliness
    // -------------------------------------------------------------
    console.log('\n--- Test 13: Footer Consistency & Sidebar Cleanliness ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const homeFooterText = await page.locator('footer').textContent();
    assert(
      homeFooterText?.includes('Vansh Patel') === true,
      `Home footer includes author copyright (got "${homeFooterText?.trim()}")`
    );
    assert(
      !homeFooterText?.includes('Pure TypeScript inference engine with zero machine learning dependencies'),
      'Old tagline removed from Home footer'
    );

    await page.goto(`${BASE_URL}/docs`, { waitUntil: 'domcontentloaded' });
    const docsFooterP = page.locator('footer p:has-text("Vansh Patel")');
    await docsFooterP.waitFor({ state: 'visible', timeout: 5000 });
    const docsFooterText = await docsFooterP.textContent();
    assert(
      docsFooterText?.includes('Vansh Patel') === true,
      `Docs footer includes author copyright (got "${docsFooterText?.trim()}")`
    );

    const docsFooterTryModel = page.locator('footer a', { hasText: 'Try the model' });
    await docsFooterTryModel.waitFor({ state: 'visible', timeout: 5000 });
    assert(
      (await docsFooterTryModel.count()) > 0,
      'Docs footer includes link to "Try the model"'
    );

    const sidebarBottomButton = page.locator('aside div.border-t:has-text("Try the model")');
    assert(
      (await sidebarBottomButton.count()) === 0,
      'Try the model button removed from bottom of documentation sidebar'
    );

    // -------------------------------------------------------------
    // Test 14: Desktop Notice Modal on <= 768px Screens (Shows Once Per Visit)
    // -------------------------------------------------------------
    console.log('\n--- Test 14: Desktop Notice Modal on <= 768px ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const mobilePage = await mobileContext.newPage();

    // 1. Visit Home first on mobile
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(500);

    const modalDialog = mobilePage.locator('[role="dialog"][aria-modal="true"]');
    assert((await modalDialog.count()) > 0, 'Desktop Notice modal is visible on mobile home page first visit');

    // Dismiss the notice
    const dismissBtn = mobilePage.locator('button', { hasText: 'Continue on this device' });
    await dismissBtn.click();
    await modalDialog.waitFor({ state: 'detached', timeout: 3000 });
    assert((await modalDialog.count()) === 0, 'Desktop Notice modal closed after clicking Continue');

    // Navigate to docs in the same session
    await mobilePage.goto(`${BASE_URL}/docs`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(500);
    assert((await modalDialog.count()) === 0, 'Desktop Notice modal does NOT show again on Docs page during same visit');

    await mobileContext.close();

    // -------------------------------------------------------------
    // Test 15: Skeletons & Responsiveness <= 768px
    // -------------------------------------------------------------
    console.log('\n--- Test 15: Responsiveness across Mobile & Tablet (360px - 768px) ---');
    const auditWidths = [360, 390, 768];
    for (const w of auditWidths) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const homeScrollOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!homeScrollOverflow, `No horizontal overflow on Home page at ${w}px`);

      await page.goto(`${BASE_URL}/docs`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const docsScrollOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!docsScrollOverflow, `No horizontal overflow on Docs page at ${w}px`);
    }

    // -------------------------------------------------------------
    // Test 16: Skeleton Header Line Distance & TopBar Collisions
    // -------------------------------------------------------------
    console.log('\n--- Test 16: Skeleton Header Line Distance & TopBar Collisions ---');
    // Check TopBar gap on 360px
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const topBarCollision = await page.evaluate(() => {
      const brand = document.querySelector('header a[aria-label="Neural Network From Scratch Home"]');
      const nav = document.querySelector('header nav');
      if (!brand || !nav) return null;
      const bRect = brand.getBoundingClientRect();
      const nRect = nav.getBoundingClientRect();
      return bRect.right > nRect.left;
    });
    assert(topBarCollision === false, 'TopBar brand and nav links do not overlap on 360px mobile screen');

    // Check Docs mobile header: brand on left, menu on right, no duplicate Home icon
    await page.goto(`${BASE_URL}/docs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const docsMobileHeaderButtons = await page.evaluate(() => {
      const header = document.querySelector('header.lg\\:hidden');
      if (!header) return null;
      const buttons = Array.from(header.querySelectorAll('button, a'));
      return {
        count: buttons.length,
        hasDuplicateHome: buttons.some((b) => b.querySelector('svg.lucide-home') !== null),
        hasMenuBtn: buttons.some((b) => b.getAttribute('aria-label')?.includes('menu')),
      };
    });
    assert(
      docsMobileHeaderButtons?.hasDuplicateHome === false,
      'Docs mobile header does not have a duplicate Home icon button'
    );
    assert(
      docsMobileHeaderButtons?.hasMenuBtn === true,
      'Docs mobile header has the menu drawer button'
    );

    // Dismiss notice modal if open on mobile
    const continueBtn = page.locator('button', { hasText: 'Continue on this device' });
    if ((await continueBtn.count()) > 0) {
      await continueBtn.click();
      await page.waitForTimeout(200);
    }

    // Open menu drawer and verify "Back to demo" is present inside the drawer
    await page.locator('header.lg\\:hidden button[aria-label*="menu"]').click();
    await page.waitForTimeout(200);
    const drawerBackToDemo = page.locator('aside.lg\\:hidden nav a', { hasText: 'Back to demo' });
    assert(
      (await drawerBackToDemo.count()) > 0,
      'Mobile menu drawer contains "Back to demo" item'
    );
    // Close mobile drawer
    await page.locator('aside.lg\\:hidden button[aria-label="Close menu"]').click();
    await page.waitForTimeout(200);

    // Check Skeleton header height matching real DocsPage header within 10px
    for (const testWidth of [1280, 768, 390]) {
      const testPage = await browser.newPage({ viewport: { width: testWidth, height: 800 } });
      let releaseRoute: (() => void) | null = null;
      await testPage.route('**/DocsPage*', async route => {
        await new Promise<void>(resolve => {
          releaseRoute = () => {
            route.continue().then(resolve);
          };
        });
      });
      await testPage.goto(`${BASE_URL}/docs`);
      await testPage.waitForTimeout(200);

      const skeletonH = await testPage.evaluate(() => {
        const h = document.querySelector('main header');
        return h ? h.getBoundingClientRect().height : null;
      });

      if (releaseRoute) (releaseRoute as () => void)();
      await testPage.waitForSelector('h1:has-text("Neural Network From Scratch")');
      await testPage.waitForTimeout(200);

      const realH = await testPage.evaluate(() => {
        const h = document.querySelector('main header');
        return h ? h.getBoundingClientRect().height : null;
      });

      assert(skeletonH !== null && realH !== null, `Found headers at ${testWidth}px`);
      if (skeletonH !== null && realH !== null) {
        const diff = Math.abs(skeletonH - realH);
        assert(diff <= 10, `Skeleton header height matches real header within 10px at ${testWidth}px (diff: ${diff.toFixed(1)}px)`);
      }
      await testPage.close();
    }

    await browser.close();

    if (errors.length > 0) {
      console.error(`\nFAILED with ${errors.length} error(s)!`);
      process.exit(1);
    } else {
      console.log('\nALL ITERATION 8B PLAYWRIGHT E2E TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Fatal error during E2E test execution:', err);
    await browser.close();
    process.exit(1);
  }
}

runE2eTests();
