const { test } = require('node:test');
const assert = require('node:assert/strict');
const { flagshipPages } = require('../../.tmp/domain/data/flagship-pages.js');
const { validateHynoePage, validatePageCollection } = require('../../.tmp/domain/domain/pages/schema.js');
const { searchPages } = require('../../.tmp/domain/domain/search/search-pages.js');
const { normalizeQuery } = require('../../.tmp/domain/domain/search/normalize-query.js');

test('flagship pages preserve independent SMP and Flicks canonical sites', () => {
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-smp').canonicalUrl, 'https://hynoesmp.com');
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-flicks').canonicalUrl, 'https://hynoeflicks.com');
  assert.equal(flagshipPages.find(p => p.slug === 'hynoe-outpost').canonicalUrl, 'https://outpost.hynoe.net');
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
  const results = searchPages(flagshipPages, 'Hynoe SMP');
  assert.equal(results[0].page.slug, 'hynoe-smp');
});

test('key product searches find the intended flagships', () => {
  assert.equal(searchPages(flagshipPages, 'Minecraft')[0].page.slug, 'hynoe-smp');
  assert.equal(searchPages(flagshipPages, 'photographer')[0].page.slug, 'hynoe-flicks');
  assert.equal(searchPages(flagshipPages, 'browser game')[0].page.slug, 'hynoe-outpost');
});

test('blank and punctuation-only searches return deterministic featured discovery', () => {
  const blank = searchPages(flagshipPages, '!!!   ');
  assert.deepEqual(blank.map(r => r.page.name), ['Hynoe Flicks', 'Hynoe Outpost', 'Hynoe SMP']);
});
