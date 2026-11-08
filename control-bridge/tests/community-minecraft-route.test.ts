import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function setup() {
  vi.resetModules();
  for (const [name, value] of Object.entries({
    MINECRAFT_CHAT_ENABLED: 'true',
    MINECRAFT_DISCORD_CHANNEL_ID: 'channel',
    MINECRAFT_DISCORD_BOT_TOKEN: 'bot-one',
    BLOOM_API_KEY: 'mock',
    BLOOM_SERVER_ID: 'mock',
    SUPABASE_URL: 'https://example.test',
    SUPABASE_PUBLISHABLE_KEY: 'mock',
  })) vi.stubEnv(name, value);
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/users/@me')) return Response.json({ id: new Headers(init.headers).get('authorization')?.slice(4) });
    return Response.json(['bot-one', 'bot-two'].map(id => ({
      id, author: { id, username: id, bot: true }, content: '[WEB] Alex: hello', timestamp: '2026-11-07T00:00:00Z',
    })));
  });
  vi.stubGlobal('fetch', fetchMock);
  const { GET } = await import('../src/app/api/community/minecraft/route');
  return { read: async () => (await GET(new Request('https://example.test/api/community/minecraft'))).json(), fetchMock };
}

it('coalesces concurrent feed requests and reuses bot identity across feed refreshes', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(10_000);
  const { read, fetchMock } = await setup();
  const results = await Promise.all([read(), read()]);
  expect(results[0]).toEqual(results[1]);
  expect(results[0].messages).toMatchObject([{ id: 'bot-one', source: 'Website' }]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  now.mockReturnValue(14_001);
  expect((await read()).messages).toMatchObject([{ id: 'bot-one', source: 'Website' }]);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/users/@me'))).toHaveLength(1);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('does not reuse a bot identity or its cached feed after the token changes', async () => {
  const { read, fetchMock } = await setup();
  expect((await read()).messages).toMatchObject([{ id: 'bot-one', source: 'Website' }]);
  vi.stubEnv('MINECRAFT_DISCORD_BOT_TOKEN', 'bot-two');
  expect((await read()).messages).toMatchObject([{ id: 'bot-two', source: 'Website' }]);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/users/@me'))).toHaveLength(2);
});
