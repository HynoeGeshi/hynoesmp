import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { publicBusinesses, sourceNeedsReview, toDirectoryPage } from '../src/data/public-businesses.ts';
import { upgradePreview, previewHeaders } from '../src/lib/preview/upgrade.ts';

const base = readFileSync(new URL('../public/preview.html', import.meta.url), 'utf8');

test('catalog has five uniquely identified factual business listings', () => {
  assert.equal(publicBusinesses.length, 5);
  assert.equal(new Set(publicBusinesses.map(x => x.slug)).size, 5);
});
test('records have provenance and no invented endorsement or private fields', () => {
  for (const b of publicBusinesses) {
    assert.match(b.slug, /^directory-[a-z0-9-]+$/);
    assert.equal(b.status, 'unclaimed'); assert.equal(b.relationship, 'none');
    assert.equal(new URL(b.website).protocol, 'https:');
    assert.equal(new URL(b.sourceUrl).hostname, new URL(b.website).hostname);
    assert.equal(b.checkedAt, '2026-10-07');
    for (const key of ['rating','reviews','logo','email','phone','owner','address']) assert.equal(key in b, false);
  }
});
test('2027 source age and malformed dates are not labeled current', () => {
  assert.equal(sourceNeedsReview('2026-10-07', new Date('2026-10-08T12:00:00Z')), false);
  assert.equal(sourceNeedsReview('2026-10-07', new Date('2027-02-01T12:00:00Z')), true);
  assert.equal(sourceNeedsReview('not-a-date', new Date('2026-10-08T12:00:00Z')), true);
});
test('adapter cannot turn a directory entry into a featured review or owner inquiry record', () => {
  for (const business of publicBusinesses) {
    const page = toDirectoryPage(business);
    assert.equal(page.featured, false); assert.match(page.id, /^directory-/);
    assert.match(page.description, /not.*endorsement/i);
    assert.equal(page.modules.some(x => x.type === 'cta'), true);
  }
});
test('the actual preview gets five business profiles and accessible controls', () => {
  const html = upgradePreview(base, publicBusinesses);
  for (const b of publicBusinesses) assert.ok(html.includes('href="/p/'+b.slug+'"'));
  assert.ok(html.includes('id="business-query"')); assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('/listing-policy#corrections')); assert.ok(html.includes('PREVIEW 02'));
});
test('untrusted names and summaries are escaped rather than executable', () => {
  const html = upgradePreview(base, [{...publicBusinesses[0],name:'<img src=x onerror=alert(1)>',summary:'"<script>alert(1)</script>'}]);
  assert.ok(html.includes('&lt;img')); assert.equal(html.includes('<img src=x'), false);
});
test('every inline block gets a CSP hash with no unsafe-inline or eval', () => {
  const html = upgradePreview(base, publicBusinesses);
  const headers = previewHeaders(html);
  assert.equal(headers['Cache-Control'], 'no-store, max-age=0');
  assert.equal(headers['X-Robots-Tag'], 'noindex, nofollow, noarchive');
  const csp = headers['Content-Security-Policy'];
  assert.equal(csp.includes('unsafe-inline'), false); assert.equal(csp.includes('unsafe-eval'), false);
  for (const tag of ['style','script']) for (const match of html.matchAll(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>','g'))) assert.ok(csp.includes(createHash('sha256').update(match[1]).digest('base64')));
  assert.ok(csp.includes("frame-ancestors 'none'"));
});
test('source aging changes the warning and preserves the historical review date', () => {
  const html = upgradePreview(base, publicBusinesses, new Date('2027-02-01T12:00:00Z'));
  assert.ok(html.includes('Source needs recheck')); assert.ok(html.includes('2026-10-07'));
});

const authSource = readFileSync(new URL('../src/lib/auth/require-user.ts', import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export async function requireUser()', 'return async function requireUser()');
const denied = () => { throw new Error('redirect:/sign-in'); };
const factory = new Function('createClient','redirect',authSource);
test('provider configuration failure fails closed to sign-in instead of crashing', async () => {
  await assert.rejects(factory(async () => { throw new Error('backend unavailable'); }, denied), /redirect:\/sign-in/);
});
test('anonymous and absent users cannot enter the owner workspace', async () => {
  for (const user of [null,{is_anonymous:true}]) await assert.rejects(factory(async () => ({auth:{getUser:async () => ({data:{user},error:null})}}),denied),/redirect:\/sign-in/);
});
test('a server-validated non-anonymous owner remains authorized', async () => {
  const user={id:'test-owner',is_anonymous:false};
  assert.equal(await factory(async () => ({auth:{getUser:async () => ({data:{user},error:null})}}),denied)(),user);
});
