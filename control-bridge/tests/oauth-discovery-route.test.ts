import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as discovery } from '../src/app/.well-known/oauth-protected-resource/route';
import { DELETE, GET, POST } from '../src/app/api/mcp/route';

describe('bridge OAuth discovery while Discord setup is incomplete', () => {
  beforeEach(() => {
    vi.stubEnv('PUBLIC_BASE_URL', 'https://bridge.example.com/');
    vi.stubEnv('SUPABASE_URL', 'https://auth.example.com/');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    vi.stubEnv('DISCORD_BOT_TOKEN', '');
    vi.stubEnv('ALLOWED_SUPABASE_USER_ID', '');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('serves public OAuth metadata without private Discord configuration', async () => {
    const response = await discovery();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      resource: 'https://bridge.example.com/api/mcp',
      authorization_servers: ['https://auth.example.com/auth/v1'],
      scopes_supported: ['openid', 'email'],
      bearer_methods_supported: ['header'],
    });
  });

  it('returns a controlled failure if OAuth itself is misconfigured', async () => {
    vi.stubEnv('SUPABASE_URL', 'http://insecure.example.com');
    const response = await discovery();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('insecure.example.com');
  });

  it.each([['GET', GET], ['POST', POST], ['DELETE', DELETE]] as const)(
    'fails closed with a safe unavailable response to %s', async (method, handle) => {
      const response = await handle(new Request('https://bridge.example.com/api/mcp', { method }));
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ error: 'Hynoe control tools are unavailable until configuration is complete.' });
    },
  );
});
