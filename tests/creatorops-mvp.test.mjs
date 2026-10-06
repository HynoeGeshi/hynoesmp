import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import './creatorops-audit-engine.test.mjs';
import './creatorops-integration.test.mjs';

const root = process.cwd();
const pagePath = path.join(root, 'creatorops', 'index.html');
const cssPath = path.join(root, 'creatorops', 'creatorops.css');
const jsPath = path.join(root, 'creatorops', 'creatorops.js');
const privacyPath = path.join(root, 'creatorops', 'privacy.html');
const termsPath = path.join(root, 'creatorops', 'terms.html');
const reportPath = path.join(root, 'creatorops', 'report.html');
const reportJsPath = path.join(root, 'creatorops', 'report.js');

function read(file) { return fs.readFileSync(file, 'utf8'); }

test('CreatorOps MVP ships a secure, monetizable creator funnel', () => {
  for (const file of [pagePath, cssPath, jsPath, privacyPath, termsPath, reportPath, reportJsPath]) assert.ok(fs.existsSync(file), `${file} must exist`);

  const html = read(pagePath);
  const css = read(cssPath);
  const js = read(jsPath);
  const reportJs = read(reportJsPath);
  const all = `${html}\n${js}`.toLowerCase();

  assert.match(html, /Hynoe CreatorOps/i);
  assert.match(html, /Free Creator Audit/i);
  assert.match(html, /\$499/);
  assert.match(html, /\$750/);
  assert.match(html, /per month|\/month/i);
  assert.match(html, /Subscribers/i);
  assert.match(html, /Views/i);

  assert.match(html, /<form[^>]+id="creator-audit-form"/i);
  for (const field of ['creatorName', 'email', 'primaryPlatform', 'profileUrl', 'goal', 'bottleneck']) {
    assert.match(html, new RegExp(`name="${field}"`, 'i'), `missing intake field ${field}`);
  }

  assert.doesNotMatch(all, /name="password"|name="api[_-]?key"|name="access[_-]?token"/i);
  assert.match(html, /never send.*password|never ask.*password|do not send.*password/i);
  assert.match(html, /oauth/i);

  assert.match(html, /<meta[^>]+name="description"/i);
  assert.match(html, /<meta[^>]+property="og:title"/i);
  assert.match(html, /<meta[^>]+name="viewport"/i);
  assert.match(html, /href="\/creatorops\/creatorops\.css"/i);
  assert.match(html, /src="\/creatorops\/creatorops\.js"/i);
  assert.match(css, /@media\s*\(/i);

  assert.match(js, /sessionStorage/i);
  assert.doesNotMatch(js, /localStorage/i);
  assert.match(js, /name = 'company'|name='company'|name="company"/i);
  assert.match(js, /\/api\/intake/i);
  assert.match(js, /stripe\.com\/test_/i);
  assert.match(js, /privacy\.html/i);
  assert.match(js, /terms\.html/i);
  assert.match(js, /application summary|copy/i);
  assert.doesNotMatch(reportJs, /innerHTML\s*=/i, 'private report renderer must not inject dynamic innerHTML');
});

test('CreatorOps proof is hydrated from the fixed verified-metrics API instead of hardcoded numbers', () => {
  const html = read(pagePath);
  const js = read(jsPath);

  for (const id of ['metric-views','metric-subscribers','metric-watch-hours','metric-likes','metric-comments','metric-shares','metric-source']) {
    assert.match(html, new RegExp(`id="${id}"`, 'i'), `missing metric hook ${id}`);
  }
  for (const literal of ['2,235','~209h','116','21','2,349','~212.7h','122','23','544']) {
    assert.doesNotMatch(html, new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `metric literal ${literal} must not be hardcoded into HTML`);
  }
  assert.match(js, /\/api\/public\/metrics\/hynoe-youtube/);
  assert.match(js, /stale_verified_snapshot/);
  assert.match(js, /verified_snapshot/);
  assert.match(js, /Verified metrics temporarily unavailable/i);
  assert.match(js, /as of/i);
  assert.doesNotMatch(js, /real-time|realtime|\blive metrics\b/i);
});

test('successful intake surfaces the private Starter Creator Audit instead of ending at review queue', () => {
  const js = read(jsPath);
  assert.match(js, /Your Starter Creator Audit is ready\./i);
  assert.match(js, /View my audit/i);
  assert.match(js, /result\.report\.url/);
  assert.doesNotMatch(js, /Your Creator Audit is now in the review queue\./i);
});

test('CreatorOps presents a premium Hynoe command-center visual system', () => {
  const html = read(pagePath);
  const css = read(cssPath);

  assert.match(html, /class="[^"]*command-center/i);
  assert.match(html, /Creator Health/i);
  assert.match(html, /Founding creator/i);
  assert.match(html, /class="[^"]*audit-benefits/i);

  assert.match(css, /--gold-glow/i);
  assert.match(css, /backdrop-filter/i);
  assert.match(css, /linear-gradient/i);
  assert.match(css, /focus-visible/i);
  assert.match(css, /prefers-reduced-motion/i);
  assert.match(css, /command-center/i);
});

test('CreatorOps speaks to mainstream modern creators with an interactive outcome-first buying journey', () => {
  const html = read(pagePath);
  const css = read(cssPath);
  const js = read(jsPath);

  assert.match(html, /Create more\.\s*Grow faster\.\s*Run less\./i);
  assert.match(html, /id="diagnostic"/i);
  for (const problem of ['stalled views', 'overwhelmed', 'not making money', 'need consistency']) {
    assert.match(html, new RegExp(problem, 'i'), `missing diagnostic problem: ${problem}`);
  }
  assert.match(html, /id="diagnostic-result"/i);
  assert.match(html, /Build My System/i);
  assert.match(html, /Run It With Me/i);
  assert.match(html, /less admin/i);
  assert.match(html, /more time creating/i);
  assert.match(html, /Founding access/i);
  assert.match(html, /What happens next/i);

  assert.match(js, /data-diagnostic/i);
  assert.match(js, /diagnostic-result/i);
  assert.match(js, /aria-pressed/i);
  assert.match(js, /IntersectionObserver/i);

  assert.match(css, /--ivory/i);
  assert.match(css, /\.light-section/i);
  assert.match(css, /\.diagnostic-stage/i);
  assert.match(css, /\.editorial-panel/i);
  assert.match(css, /\.reveal/i);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/i);
});
