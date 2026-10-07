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
    // Accept the explicit independence disclaimer as well as the legacy phrasing.
    assert.match(html, /not affiliated with (?:or endorsed by )?Mojang or Microsoft|NOT AN OFFICIAL MINECRAFT SERVICE\. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT\./i);
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

test('privacy notice distinguishes local saves, online community records, and opt-in leaderboard publishing', () => {
  const html = read('privacy.html');
  assert.match(html, /supports browser-local play without an email account/i);
  assert.match(html, /localStorage|stored on your device|browser storage/i);
  assert.match(html, /Global Chat and Ask Hynoe use online community sessions and server-side records/i);
  assert.match(html, /server-side profile/);
  assert.match(html, /Hall of Legends can load public rankings/i);
  assert.match(html, /score-publication control is optional and off by default/i);
  assert.match(html, /random local player identifier/i);
  assert.match(html, /gameplay metrics for ranking/i);
  assert.match(html, /Turning it off stops future score submissions but does not automatically remove an existing record/i);
  assert.match(html, /18\+/i);
  assert.match(html, /not a parental-consent mechanism/i);
  assert.doesNotMatch(html, /website chat[^<]*(?:not connected|inactive|not active)/i);
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

test('data deletion page gives local deletion and private server-record request paths', () => {
  const html = read('data-deletion.html');
  assert.match(html, /browser (?:storage|site data)|localStorage/i);
  assert.match(html, /Leaderboard publication/i);
  assert.match(html, /Turn off <strong>Publish my score<\/strong> to stop future score submissions/i);
  assert.match(html, /does not automatically remove an existing public ranking/i);
  assert.match(html, /does not request deletion of Hynoe's server records/i);
  assert.match(html, /does not send an erasure request/i);
  assert.match(html, /do not post[^<]*(?:player ID|identifier|private)/i);
  assert.match(html, /Discord/i);
});
