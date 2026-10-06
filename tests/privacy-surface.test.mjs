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

test('privacy notice describes local saves, opt-in leaderboard, and site-only Global Chat accurately', () => {
  const html = read('privacy.html');
  assert.match(html, /cloud (?:accounts|saves)[^<]*(?:are not|aren't|not yet) live/i);
  assert.match(html, /localStorage|stored on your device|browser storage/i);
  assert.match(html, /Hall of Legends[^<]*viewed by everyone/i);
  assert.match(html, /publishing your own score[^<]*optional[^<]*off by default/i);
  assert.match(html, /random local player ID|random player ID/i);
  assert.match(html, /bounded gameplay metrics/i);
  assert.match(html, /Website Global Chat/i);
  assert.match(html, /site-only public community feature/i);
  assert.match(html, /not connected to Minecraft or Bloom/i);
  assert.match(html, /pseudonymous guest session/i);
  assert.match(html, /Ask Hynoe conversations are separate from public chat/i);
  assert.match(html, /under 18|18\+/i);
  assert.doesNotMatch(html, /we guarantee|100% secure|fully compliant/i);
});

test('global board reads are live while score publishing is gated by explicit opt in', () => {
  const ui = read('assets/watch.mjs');
  const transport = read('assets/leaderboard-live.mjs');
  assert.match(ui, /GLOBAL_BOARD_ENABLED=true/);
  assert.match(ui, /leaderboardOptedIn=L\.readOptIn\(\)/);
  assert.match(ui, /leaderboardOptedIn&&\(force\|\|key!==lastSubmittedKey\)/);
  assert.match(ui, /!GLOBAL_BOARD_ENABLED\|\|!leaderboardOptedIn/);
  assert.match(ui, /if\(GLOBAL_BOARD_ENABLED\)connectLeaderboard\(\)/);
  assert.match(ui, /G\.legendStatus\(state\)/);
  assert.match(transport, /PUBLIC_BOARD_PATH='\/v1\/leaderboard'/);
  assert.match(transport, /SCORE_PATH='\/v1\/score'/);
  assert.match(transport, /getItem\(OPT_IN_KEY\)==='yes'/);
});

test('leaderboard UI explains live rankings and explicit publishing choice', () => {
  const html = read('watch.html');
  assert.match(html, /GLOBAL HALL CONNECTING/i);
  assert.match(html, /LIVE RANKINGS/i);
  assert.match(html, /Publishing your own score is optional and off by default/i);
  assert.match(html, /stays local until you explicitly opt in/i);
});

test('data deletion page gives local deletion and private leaderboard-data request paths', () => {
  const html = read('data-deletion.html');
  assert.match(html, /browser (?:storage|site data)|localStorage/i);
  assert.match(html, /Global leaderboard records/i);
  assert.match(html, /Publishing your own score is optional and off by default/i);
  assert.match(html, /stops future score uploads/i);
  assert.match(html, /do not post[^<]*(?:player ID|identifier|private)/i);
  assert.match(html, /Discord/i);
});
