import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/app.mjs', import.meta.url), 'utf8');

test('browser bootstrap gates data behind Supabase auth', () => {
  assert.match(source, /from ['"]\/vendor\/supabase\.mjs['"]/);
  assert.match(source, /auth\.getSession\s*\(/);
  assert.match(source, /auth\.onAuthStateChange\s*\(/);
  assert.match(source, /auth\.signInWithPassword\s*\(/);
  assert.match(source, /auth\.signOut\s*\(/);
  assert.match(source, /if\s*\(!session\)/);
  assert.match(source, /candidateList\.replaceChildren\s*\(/);
});

test('candidate text uses textContent', () => {
  assert.match(source, /function\s+renderCandidateCard\s*\(/);
  assert.match(source, /\.textContent\s*=/);
});

test('ready clips wire signed playback into video controls', () => {
  assert.match(source, /attachPreview/);
  assert.match(source, /document\.createElement\(['"]video['"]\)/);
  assert.match(source, /video\.controls\s*=\s*true/);
  assert.match(source, /video\.playsInline\s*=\s*true/);
  assert.match(source, /video\.preload\s*=\s*['"]metadata['"]/);
  assert.match(source, /Rendered, but preview could not be opened/);
  assert.match(source, /Retry preview/);
});

test('approval UI locks controls and refreshes after action', () => {
  assert.match(source, /submitApproval/);
  assert.match(source, /button\.disabled\s*=\s*true/);
  assert.match(source, /button\.disabled\s*=\s*false/);
  assert.match(source, /await\s+refreshCandidates\s*\(/);
  assert.match(source, /finally/);
  assert.match(source, /Approve/);
  assert.match(source, /Reject/);
  assert.match(source, /approval_state\s*!==\s*['"]pending['"]/);
});
