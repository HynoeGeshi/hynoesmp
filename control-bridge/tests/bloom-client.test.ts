import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import { createBloomClient } from '../src/bloom/client';

const config = {
  bloomPanelUrl: 'https://mc.bloom.host', bloomApiKey: 'bloom-key', bloomServerId: 'srv',
  discordBotToken: 'd', discordGuildId: 'g', discordAllowedChannelIds: ['c'], supabaseUrl: 'https://x.supabase.co',
  supabasePublishableKey: 'p', allowedSupabaseUserId: 'u', publicBaseUrl: 'https://b.example.com', auditLogEnabled: true,
} satisfies AppConfig;

describe('BloomClient', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses Pterodactyl bearer and accept headers', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ attributes: { name: 'Hynoe' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createBloomClient(config).getServer();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer bloom-key');
    expect(new Headers(init.headers).get('accept')).toContain('pterodactyl.v1+json');
  });

  it('posts commands and supported power signals', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createBloomClient(config);
    await client.sendCommand('list');
    await client.setPower('restart');
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/command'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ command: 'list' }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('/power'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ signal: 'restart' }) }));
  });

  it('uses normalized paths for file operations', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/contents')) return new Response('motd=Hynoe', { status: 200 });
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = createBloomClient(config);
    await client.listFiles('/config');
    await client.readFile('/server.properties');
    await client.writeFile('/config/test.toml', 'x=1');
    expect(fetchMock.mock.calls.map(([u]) => String(u)).join('\n')).not.toContain('..');
    expect(fetchMock.mock.calls.map(([u]) => String(u)).join('\n')).toContain(encodeURIComponent('server.properties'));
  });

  it('lists backup metadata', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [{ attributes: { uuid: 'b1', name: 'nightly' } }] }), { status: 200 })));
    const result = await createBloomClient(config).listBackups();
    expect(result).toEqual([{ uuid: 'b1', name: 'nightly' }]);
  });
});
