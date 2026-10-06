import { chromium, webkit } from 'playwright';
import * as G from '../assets/watch-game.mjs';

const base = 'http://127.0.0.1:4173';

function restoredRunState() {
  const s = G.fresh(Date.now());
  s.ore = 1_000_000;
  s.total = 1_000_000;
  s.run = 100_000;
  s.blocks = 100;
  s.progress.chapter = 8;
  G.ensureVeins(s);
  if (!G.startSurvey(s, 2)) throw new Error('Test setup could not start a cave run.');
  return s;
}

const saved = JSON.stringify(restoredRunState());
for (const [engineName, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await engine.launch({ headless: true });
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));

  await page.addInitScript(raw => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('hynoeOutpostV1', raw);
  }, saved);

  await page.goto(`${base}/watch.html?restored-run=${engineName}-${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const mine = await page.evaluate(() => {
    const button = document.querySelector('#vein-0');
    const strong = button?.querySelector('strong');
    const small = button?.querySelector('small');
    const health = button?.querySelector('.vein-health i');
    const face = button?.querySelector('.gem-face');
    return {
      count: document.querySelectorAll('.vein').length,
      name: strong?.textContent?.trim() || '',
      detail: small?.textContent?.trim() || '',
      oreColor: button?.style.getPropertyValue('--ore') || '',
      faceFill: face ? getComputedStyle(face).fill : '',
      healthWidth: health?.style.width || ''
    };
  });

  if (errors.length) throw new Error(`${engineName} restored cave run raised page errors: ${errors.join(' | ')}`);
  if (mine.count !== 12) throw new Error(`${engineName}: expected 12 mine cards, got ${mine.count}.`);
  if (!mine.name || !mine.detail || !mine.oreColor || !mine.healthWidth) {
    throw new Error(`${engineName} restored cave run left mine cards unpainted: ${JSON.stringify(mine)}`);
  }
  if (!mine.faceFill || mine.faceFill === 'rgb(0, 0, 0)' || mine.faceFill === 'rgba(0, 0, 0, 0)') {
    throw new Error(`${engineName} restored cave run rendered a black/empty gem: ${mine.faceFill}`);
  }

  const before = Number((await page.locator('#ore').textContent())?.replace(/[^0-9.-]/g, '') || 0);
  await page.locator('#vein-0').tap();
  await page.waitForTimeout(100);
  const after = Number((await page.locator('#ore').textContent())?.replace(/[^0-9.-]/g, '') || 0);
  if (!(after > before)) throw new Error(`${engineName} restored-run physical tap did not mine: ${before} -> ${after}`);

  await context.close();
  await browser.close();
  console.log(`${engineName} RESTORED RUN PASS: active cave save paints mine cards and accepts touch.`);
}
