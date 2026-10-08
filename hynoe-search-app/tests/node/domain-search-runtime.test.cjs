const { test } = require('node:test');
const assert = require('node:assert/strict');
const { flagshipPages } = require('../../.tmp/domain/data/flagship-pages.js');
const { validateHynoePage, validatePageCollection } = require('../../.tmp/domain/domain/pages/schema.js');
const { searchPages } = require('../../.tmp/domain/domain/search/search-pages.js');
const { normalizeQuery } = require('../../.tmp/domain/domain/search/normalize-query.js');

test('flagships point to working destinations and preserve the current Outpost origin', () => {
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-smp').canonicalUrl, 'https://hynoesmp.com');
  const flicks = flagshipPages.find(p => p.slug === 'hynoe-flicks');
  assert.equal(flicks.canonicalUrl, 'https://hynoe-search-direct.onrender.com/p/hynoe-flicks');
  assert.equal(flicks.modules.some(m => m.type === 'cta'), false);
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-outpost').canonicalUrl, 'https://hynoesmp.com/watch.html#game');
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-creatorops').canonicalUrl, 'https://hynoe-creatorops.onrender.com/creatorops');
});
test('unsafe canonical URL is rejected', () => {
  const bad = structuredClone(flagshipPages[0]); bad.canonicalUrl = 'http://example.com';
  assert.throws(() => validateHynoePage(bad), /HTTPS/);
});
test('duplicate slugs are rejected', () => {
  assert.throws(() => validatePageCollection([flagshipPages[0], structuredClone(flagshipPages[0])]), /Duplicate slug/);
});
test('query normalization handles case and punctuation', () => {
  assert.equal(normalizeQuery('  MINECRAFT!!!  Server '), 'minecraft server');
});
test('exact name match outranks weaker matches', () => {
  assert.equal(searchPages(flagshipPages, 'Hynoe SMP')[0].page.slug, 'hynoe-smp');
});
test('key product searches find the intended flagships', () => {
  assert.equal(searchPages(flagshipPages, 'Minecraft')[0].page.slug, 'hynoe-smp');
  assert.equal(searchPages(flagshipPages, 'photographer')[0].page.slug, 'hynoe-flicks');
  assert.equal(searchPages(flagshipPages, 'browser game')[0].page.slug, 'hynoe-outpost');
  assert.equal(searchPages(flagshipPages, 'CreatorOps')[0].page.slug, 'hynoe-creatorops');
});
test('blank and punctuation-only searches return deterministic expanded flagship discovery', () => {
  const expected = ['Hynoe', 'Hynoe CreatorOps', 'Hynoe Flicks', 'Hynoe Outpost', 'Hynoe SMP'];
  assert.deepEqual(searchPages(flagshipPages, '!!!   ').map(r => r.page.name), expected);
  assert.deepEqual(searchPages(flagshipPages, '').map(r => r.page.name), expected);
});
