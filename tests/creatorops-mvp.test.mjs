import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagePath = path.join(root, 'creatorops', 'index.html');
const cssPath = path.join(root, 'creatorops', 'creatorops.css');
const jsPath = path.join(root, 'creatorops', 'creatorops.js');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('CreatorOps MVP ships a secure, monetizable creator funnel', () => {
  assert.ok(fs.existsSync(pagePath), 'creatorops/index.html must exist');
  assert.ok(fs.existsSync(cssPath), 'creatorops/creatorops.css must exist');
  assert.ok(fs.existsSync(jsPath), 'creatorops/creatorops.js must exist');

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

  assert.match(js, /localStorage/i);
  assert.match(js, /mailto:|intakeEndpoint|INTAKE_ENDPOINT/i);
  assert.match(js, /application summary|copy/i);
});
