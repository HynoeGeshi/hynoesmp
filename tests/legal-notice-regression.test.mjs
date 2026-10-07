import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const legalPages = ['privacy.html', 'terms.html', 'data-deletion.html'];

for (const path of legalPages) {
  const html = read(path);
  test(`${path}: legal notices do not load community, player, or remote scripts`, () => {
    assert.doesNotMatch(html, /<(script|iframe)\b/i);
    assert.doesNotMatch(html, /site-social-panel|on(?:load|click|error)\s*=/i);
    assert.match(html, /script-src 'none'/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /frame-src 'none'/);
  });
  test(`${path}: document structure and legal navigation remain accessible`, () => {
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /name="viewport"/);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    for (const link of [...legalPages, 'community-rules.html', 'index.html']) {
      assert.ok(html.includes(`href="${link}"`), `${path} must link ${link}`);
    }
    assert.match(html, /NOT AN OFFICIAL MINECRAFT SERVICE/);
  });
  test(`${path}: does not repeat blanket no-account/no-chat claims`, () => {
    assert.doesNotMatch(html, /Cloud accounts (?:and cloud saves )?are not live/i);
    assert.doesNotMatch(html, /website chat relay is not connected/i);
    assert.doesNotMatch(html, /no Hynoe email\/cloud account to delete/i);
  });
}

test('privacy distinguishes local play from server-side community identity', () => {
  const html = read('privacy.html');
  assert.match(html, /server-side profile/);
  assert.match(html, /authentication session/);
  assert.match(html, /Supabase/);
  assert.match(html, /presence can include/);
});

test('privacy discloses Ask Hynoe server processing and conditional model processing', () => {
  const html = read('privacy.html');
  assert.match(html, /limited recent conversation history/);
  assert.match(html, /request metrics and help-feedback records/);
  assert.match(html, /model provider may also process/);
  assert.match(html, /not posted to Global Chat/);
  assert.match(html, /does not mean offline-only/);
});

test('local deletion is not presented as server-side erasure', () => {
  const html = read('data-deletion.html');
  assert.match(html, /does not send an erasure request/);
  assert.match(html, /does not request deletion of Hynoe's server records/);
  assert.match(html, /does not automatically remove an existing public ranking/);
});

test('YouTube and Google policies are directly linked', () => {
  for (const path of ['privacy.html', 'terms.html']) {
    const html = read(path);
    assert.match(html, /href="https:\/\/www\.youtube\.com\/t\/terms"/);
    assert.match(html, /href="https:\/\/policies\.google\.com\/privacy"/);
  }
  assert.match(read('terms.html'), /agree to be bound by those terms/);
});

test('notices do not portray a future age rule as implemented verification', () => {
  assert.match(read('privacy.html'), /not a parental-consent mechanism/);
  assert.match(read('terms.html'), /not a claim that existing community tools verify age/);
});

test('ownership preserves user content, third-party licenses, and statutory rights', () => {
  const terms = read('terms.html');
  assert.match(terms, /does not transfer ownership of user content/);
  assert.match(terms, /do not override open-source licenses/);
  assert.match(terms, /rights that cannot lawfully be excluded/);
  const copyright = read('COPYRIGHT.md');
  assert.match(copyright, /licenses take precedence/);
  assert.match(copyright, /not abstract ideas, facts, systems, or methods/);
  assert.match(copyright, /GitHub's terms/);
});
