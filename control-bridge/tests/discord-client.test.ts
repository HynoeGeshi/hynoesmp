import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import { createDiscordClient } from '../src/discord/client';

const config = {
  discordBotToken: 'bot-token', discordGuildId: 'guild-1', discordAllowedChannelIds: ['chan-1'],
} as AppConfig;

describe('Discord client', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('uses Bot auth and v10 API', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createDiscordClient(config).listGuildChannels();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('discord.com/api/v10/guilds/guild-1/channels');
    expect(new Headers(init.headers).get('authorization')).toBe('Bot bot-token');
  });
  it('disables mentions by default when sending', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'm1', author: { id: 'bot' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createDiscordClient(config).sendMessage('chan-1', 'hello', false);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ allowed_mentions: { parse: [] } });
  });
  it('requests recent messages with bounded limit', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createDiscordClient(config).recentMessages('chan-1', 250);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit?][];
    expect(String(calls[0][0])).toContain('limit=100');
  });
});
