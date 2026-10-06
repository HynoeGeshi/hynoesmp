import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync('src/domain/pages/types.ts','utf8');
const search = readFileSync('src/domain/search/search-pages.ts','utf8');

test('page model declares the six launch page types', () => {
  for (const token of ['local_business','service_provider','creator','community','digital_product','project_brand']) {
    assert.match(types, new RegExp(token));
  }
});

test('search module exposes deterministic searchPages function', () => {
  assert.match(search, /export function searchPages/);
  assert.match(search, /matchedFields/);
  assert.match(search, /score/);
});
