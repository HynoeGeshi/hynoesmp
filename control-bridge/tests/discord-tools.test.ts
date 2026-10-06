import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { DiscordClient } from '../src/discord/types';
import { createDiscordTools } from '../src/tools/discord';

const config = { discordAllowedChannelIds: ['allowed'], discordGuildId: 'guild' } as AppConfig;
const client = {
  listGuildChannels: vi.fn(async () => [{ id: 'allowed', name: 'server-chat', type: 0 }, { id: 'blocked', name: 'staff', type: 0 }]),
  recentMessages: vi.fn(async () => [{ id: 'm1', content: 'campaign bug here', author: { id: 'u1', username: 'player' } }]),
  sendMessage: vi.fn(async () => ({ id: 'm2', content: 'ok', author: { id: 'bot', username: 'Hynoe' })),
  getCurrentUser: vi.fn(async () => ({ id: 'bot', username: 'Hynoe' })),
  getMessage: vi.fn(async () => ({ id: 'm2', content: 'ok', author: { id: 'bot', username: 'Hynoe' })),
  deleteMessage: vi.fn(async () => undefined),
} as unknown as DiscordClient;

describe('Discord tools', () => {
  it('lists only allowlisted channels', async () => {
    const result = await createDiscordTools(config, client).discord_list_channels();
    expect(result.channels.map((c) => c.id)).toEqual(['allowed']);
  });
  it('blocks reads outside the channel allowlist', async () => {
    await expect(createDiscordTools(config, client).discord_recent_messages({ channelId: 'blocked' })).rejects.toThrow(/channel/i);
  });
  it('blocks mass mention by default', async () => {
    await expect(createDiscordTools(config, client).discord_send_message({ channelId: 'allowed', content: '@everyone hi' })).rejects.toThrow(/mention/i);
  });
  it('searches only a bounded recent window', async () => {
    const result = await createDiscordTools(config, client).discord_search_recent({ query: 'campaign', channelId: 'allowed' });
    expect(result.matches).toHaveLength(1);
    expect(client.recentMessages).toHaveBeenCalledWith('allowed', 100);
  });
  it('deletes only bot-authored messages', async () => {
    const tools = createDiscordTools(config, client);
    await tools.discord_delete_own_message({ channelId: 'allowed', messageId: 'm2' });
    expect(client.deleteMessage).toHaveBeenCalledWith('allowed', 'm2');
    vi.mocked(client.getMessage).mockResolvedValueOnce({ id: 'm3', content: 'user', author: { id: 'u1', username: 'player' } });
    await expect(tools.discord_delete_own_message({ channelId: 'allowed', messageId: 'm3' })).rejects.toThrow(/bot/i);
  });
});
