import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagePath = path.join(root, 'creatorops', 'index.html');
const cssPath = path.join(root, 'creatorops', 'creatorops.css');
const jsPath = path.join(root, 'creatorops', 'creatorops.js');
const privacyPath = path.join(root, 'creatorops', 'privacy.html');
const termsPath = path.join(root, 'creatorops', 'terms.html');

function read(file) { return fs.readFileSync(file, 'utf8'); }

test('CreatorOps MVP ships a secure, monetizable creator funnel', () => {
  for (const file of [pagePath, cssPath, jsPath, privacyPath, termsPath]) assert.ok(fs.existsSync(file), `${file} must exist`);

  const html = read(pagePath);
  const css = read(cssPath);
  const js = read(jsPath);
  const all = `${html}\n${js}`.toLowerCase();

  assert.match(html, /Hynoe CreatorOps/i);
  assert.match(html, /Free Creator Audit/i);
  assert.match(html, /\$499/);
  assert.match(html, /\$750/);
  assert.match(html, /per month|\/month/i);
  assert.match(html, /544 subscribers/i);
  assert.match(html, /2,235 views/i);

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
  assert.match(css, /@media\s*\(/i);

  assert.match(js, /sessionStorage/i);
  assert.doesNotMatch(js, /localStorage/i);
  assert.match(js, /name = 'company'|name='company'|name="company"/i);
  assert.match(js, /\/api\/intake/i);
  assert.match(js, /stripe\.com\/test_/i);
  assert.match(js, /privacy\.html/i);
  assert.match(js, /terms\.html/i);
  assert.match(js, /application summary|copy/i);
});

test('CreatorOps presents a premium Hynoe command-center visual system', () => {
  const html = read(pagePath);
  const css = read(cssPath);

  assert.match(html, /class="[^"]*hero-kicker/i);
  assert.match(html, /class="[^"]*command-center/i);
  assert.match(html, /Creator Health/i);
  assert.match(html, /class="[^"]*workflow-rail/i);
  assert.match(html, /Discover/i);
  assert.match(html, /Optimize/i);
  assert.match(html, /Monetize/i);
  assert.match(html, /class="[^"]*proof-spotlight/i);
  assert.match(html, /Founding creator/i);
  assert.match(html, /class="[^"]*audit-benefits/i);

  assert.match(css, /--gold-glow/i);
  assert.match(css, /backdrop-filter/i);
  assert.match(css, /linear-gradient/i);
  assert.match(css, /focus-visible/i);
  assert.match(css, /prefers-reduced-motion/i);
  assert.match(css, /command-center/i);
  assert.match(css, /workflow-rail/i);
  assert.match(css, /proof-spotlight/i);
});
