import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('preview re-sign failure is connected to visible retry UI', async () => {
  const source = await readFile(new URL('../public/app.mjs', import.meta.url), 'utf8');
  assert.match(source, /hynoe-preview-sign-failed/);
  assert.match(source, /showPreviewError/);
});
