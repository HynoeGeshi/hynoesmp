import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { verifyMcpAccessToken, AuthError } from '../src/auth/verify-token';
import type { AppConfig } from '../src/config';

const config: AppConfig = {
  bloomPanelUrl: 'https://mc.bloom.host', bloomApiKey: 'bloom-secret', bloomServerId: 'srv',
  discordBotToken: 'discord-secret', discordGuildId: 'guild', discordAllowedChannelIds: ['chan'],
  supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'pub', allowedSupabaseUserId: 'owner-user',
  publicBaseUrl: 'https://bridge.example.com', auditLogEnabled: true,
};

describe('verifyMcpAccessToken', () => {
  let privateKey: CryptoKey;
  let jwk: JsonWebKey & { kid?: string; alg?: string; use?: string };
  beforeEach(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    jwk = await exportJWK(pair.publicKey) as JsonWebKey & { kid?: string; alg?: string; use?: string };
    jwk.kid = 'test-key'; jwk.alg = 'RS256'; jwk.use = 'sig';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })));
  });

  async function token(sub: string, expires = '5m') {
    return new SignJWT({ email: 'owner@example.com', scope: 'openid email', client_id: 'chatgpt-client' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject(sub).setIssuer(`${config.supabaseUrl}/auth/v1`).setIssuedAt().setExpirationTime(expires)
      .sign(privateKey);
  }

  it('rejects a missing bearer token with OAuth challenge metadata', async () => {
    await expect(verifyMcpAccessToken(new Request('https://bridge.example.com/api/mcp'), config))
      .rejects.toMatchObject({ status: 401, challenge: expect.stringContaining('resource_metadata') });
  });

  it('rejects a valid token for the wrong Supabase user', async () => {
    const jwt = await token('someone-else');
    await expect(verifyMcpAccessToken(new Request('https://bridge.example.com/api/mcp', { headers: { authorization: `Bearer ${jwt}` } }), config))
      .rejects.toMatchObject({ status: 403 });
  });

  it('accepts a valid token for the configured owner', async () => {
    const jwt = await token('owner-user');
    const auth = await verifyMcpAccessToken(new Request('https://bridge.example.com/api/mcp', { headers: { authorization: `Bearer ${jwt}` } }), config);
    expect(auth).toEqual({ userId: 'owner-user', clientId: 'chatgpt-client', email: 'owner@example.com', scopes: ['openid', 'email'] });
  });

  it('rejects OAuth clients when a direct dashboard session is required', async () => {
    const jwt = await token('owner-user');
    await expect(verifyMcpAccessToken(new Request('https://bridge.example.com/api/discord/approval', { headers: { authorization: `Bearer ${jwt}` } }), config, { directSessionOnly: true })).rejects.toMatchObject({ status: 403 });
  });

  it('rejects expired tokens', async () => {
    const jwt = await token('owner-user', '-1s');
    await expect(verifyMcpAccessToken(new Request('https://bridge.example.com/api/mcp', { headers: { authorization: `Bearer ${jwt}` } }), config))
      .rejects.toBeInstanceOf(AuthError);
  });
});
