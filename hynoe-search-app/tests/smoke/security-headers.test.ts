import assert from 'node:assert/strict';
import { test } from 'vitest';
import config from '../../next.config';

test('Search emits its browser security policy on all routes', async () => {
  assert.ok(config.headers, 'security headers must be configured');
  const routes = await config.headers();
  const policy = routes.find((route) => route.source === '/:path*');
  assert.ok(policy, 'policy must cover public, auth, and API routes');
  const headers = Object.fromEntries(policy.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['cross-origin-opener-policy'], 'same-origin');
  assert.equal(headers['permissions-policy'], 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
});

test('hardening preserves existing runtime and analytics compatibility', async () => {
  assert.equal(config.poweredByHeader, false);
  const routes = typeof config.headers === 'function' ? await config.headers() : [];
  const headerNames = routes.flatMap((route) => route.headers.map(({ key }) => key.toLowerCase()));
  assert.ok(!headerNames.includes('content-security-policy'), 'do not add unverified CSP restrictions');
});
