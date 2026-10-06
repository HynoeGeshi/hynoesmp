import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

for (const page of ['privacy.html','terms.html','data-deletion.html','community-rules.html']) {
  test(`${page} carries Hynoe legal and browser security controls`, () => {
    assert.ok(existsSync(new URL(`../${page}`, import.meta.url)), `${page} must exist`);
    const html = read(page);
    assert.match(html, /http-equiv="Content-Security-Policy"/i);
    assert.match(html, /object-src 'none'/);
    assert.match(html, /base-uri 'self'/);
    assert.match(html, /upgrade-insecure-requests/);
    assert.match(html, /name="referrer"/);
    assert.match(html, /Copyright © 2026 Hynoe/);
    assert.match(html, /not affiliated with (?:or endorsed by )?Mojang or Microsoft/i);
  });
}

test('homepage and Watch & Play surface privacy, terms and deletion routes', () => {
  for (const name of ['index.html','watch.html']) {
    const html = read(name);
    assert.match(html, /href="privacy\.html"/);
    assert.match(html, /href="terms\.html"/);
    assert.match(html, /href="data-deletion\.html"/);
  }
});

test('privacy notice describes current local-only account state instead of future promises', () => {
  const html = read('privacy.html');
  assert.match(html, /cloud (?:accounts|saves)[^<]*(?:are not|aren't|not yet) live/i);
  assert.match(html, /localStorage|stored on your device|browser storage/i);
  assert.match(html, /global leaderboard[^<]*(?:paused|privacy hold)/i);
  assert.match(html, /website chat[^<]*(?:not connected|inactive|not active)/i);
  assert.match(html, /under 18|18\+/i);
  assert.doesNotMatch(html, /we guarantee|100% secure|fully compliant/i);
});

test('external global leaderboard is code-gated off while local legend scoring remains', () => {
  const js = read('assets/watch.mjs');
  assert.match(js, /GLOBAL_BOARD_ENABLED=false/);
  assert.match(js, /LOCAL ONLY · PRIVACY HOLD/);
  assert.match(js, /if\(GLOBAL_BOARD_ENABLED\)connectLeaderboard\(\)/);
  assert.match(js, /if\(!GLOBAL_BOARD_ENABLED\)return/);
  assert.match(js, /G\.legendStatus\(state\)/);
});

test('leaderboard UI explains privacy hold and local score continuity', () => {
  const html = read('watch.html');
  assert.match(html, /GLOBAL SYNC PAUSED/i);
  assert.match(html, /local Legend score/i);
  assert.match(html, /worldwide privacy|privacy and deletion|privacy\/deletion/i);
});

test('data deletion page gives local deletion and private legacy-data request paths', () => {
  const html = read('data-deletion.html');
  assert.match(html, /browser (?:storage|site data)|localStorage/i);
  assert.match(html, /legacy leaderboard/i);
  assert.match(html, /do not post[^<]*(?:player ID|identifier|private)/i);
  assert.match(html, /Discord/i);
});
