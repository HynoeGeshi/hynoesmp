import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('root application page exists', () => {
  assert.equal(existsSync('src/app/page.tsx'), true);
});
