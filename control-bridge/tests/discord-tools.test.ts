import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { DiscordClient } from '../src/discord/types';
import { createDiscordTools } from '../src/tools/discord';

const legacyConfig = { discordAllowedChannelIds: ['allowed'], discordGuildId: 'guild' } as AppConfig;
const guildConfig = { discordAllowedChannelIds: [], discordGuildId: 'guild', discordGuildManagementEnabled: true } as AppConfig;

function makeClient(): DiscordClient {
  return {
    getGuild: vi.fn(async () => ({ id: 'guild', name: 'Hynoe Community', description: 'Hynoe hub' })),
    listGuildChannels: vi.fn(async () => [
      { id: 'cat', name: 'Hynoe Community', type: 4, position: 0 },
      { id: 'allowed', name: 'server-chat', type: 0, parent_id: 'cat', position: 1, permission_overwrites: [] },
      { id: 'blocked', name: 'general', type: 0, parent_id: 'cat', position: 2, permission_overwrites: [{ id: 'role', type: 0, allow: '1024', deny: '0' }] },
    ]),
    listGuildRoles: vi.fn(async () => [{ id: 'guild', name: '@everyone', position: 0 }, { id: 'role', name: 'Member', position: 1 }]),
    listGuildWebhooks: vi.fn(async () => [{ id: 'hook', channel_id: 'allowed', name: 'Minecraft bridge' }]),
    getGuildOnboarding: vi.fn(async () => ({ guild_id: 'guild', enabled: true, prompts: [] })),
    recentMessages: vi.fn(async (channelId: string) => [{ id: `m-${channelId}`, content: 'campaign bug here', timestamp: '2026-10-06T10:00:00Z', author: { id: 'u1', username: 'player' } }]),
    sendMessage: vi.fn(async () => ({ id: 'm2', content: 'ok', author: { id: 'bot', username: 'Hynoe' } })),
    getCurrentUser: vi.fn(async () => ({ id: 'bot', username: 'Hynoe' })),
    getMessage: vi.fn(async () => ({ id: 'm2', content: 'ok', author: { id: 'bot', username: 'Hynoe' } })),
    deleteMessage: vi.fn(async () => undefined),
  } as unknown as DiscordClient;
}

describe('Discord tools', () => {
  it('lists only allowlisted channels in legacy mode', async () => {
    const client = makeClient();
    const result = await createDiscordTools(legacyConfig, client).discord_list_channels();
    expect(result.channels.map((c) => c.id)).toEqual(['allowed']);
  });

  it('lists the whole guild in management mode', async () => {
    const client = makeClient();
    const result = await createDiscordTools(guildConfig, client).discord_list_channels();
    expect(result.channels.map((c) => c.id)).toEqual(['cat', 'allowed', 'blocked']);
  });

  it('returns a credential-free guild overview with categories, channels, roles, and onboarding', async () => {
    const client = makeClient();
    const result = await createDiscordTools(guildConfig, client).discord_guild_overview();
    expect(result.guild).toMatchObject({ id: 'guild', name: 'Hynoe Community' });
    expect(result.categories.map((c) => c.id)).toEqual(['cat']);
    expect(result.channels.map((c) => c.id)).toEqual(['allowed', 'blocked']);
    expect(result.roles).toHaveLength(2);
    expect(result.onboarding).toMatchObject({ enabled: true });
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('lists roles and webhooks and exposes channel permission overwrites', async () => {
    const client = makeClient();
    const tools = createDiscordTools(guildConfig, client);
    expect((await tools.discord_list_roles()).roles).toHaveLength(2);
    expect((await tools.discord_list_webhooks()).webhooks).toHaveLength(1);
    expect((await tools.discord_channel_permissions({ channelId: 'blocked' })).permissionOverwrites).toEqual([
      { id: 'role', type: 0, allow: '1024', deny: '0' },
    ]);
  });

  it('bounds activity summary to 25 channels and 100 messages per channel', async () => {
    const client = makeClient();
    const channelIds = Array.from({ length: 40 }, (_, index) => `c${index}`);
    const result = await createDiscordTools(guildConfig, client).discord_activity_summary({ channelIds, perChannelLimit: 999 });
    expect(client.recentMessages).toHaveBeenCalledTimes(25);
    expect(vi.mocked(client.recentMessages).mock.calls.every(([, limit]) => limit === 100)).toBe(true);
    expect(result.channels).toHaveLength(25);
  });

  it('blocks reads outside the channel allowlist in legacy mode', async () => {
    await expect(createDiscordTools(legacyConfig, makeClient()).discord_recent_messages({ channelId: 'blocked' })).rejects.toThrow(/channel/i);
  });

  it('blocks mass mention by default', async () => {
    await expect(createDiscordTools(legacyConfig, makeClient()).discord_send_message({ channelId: 'allowed', content: '@everyone hi' })).rejects.toThrow(/mention/i);
  });

  it('searches only a bounded recent window', async () => {
    const client = makeClient();
    const result = await createDiscordTools(legacyConfig, client).discord_search_recent({ query: 'campaign', channelId: 'allowed' });
    expect(result.matches).toHaveLength(1);
    expect(client.recentMessages).toHaveBeenCalledWith('allowed', 100);
  });

  it('deletes only bot-authored messages', async () => {
    const client = makeClient();
    const tools = createDiscordTools(legacyConfig, client);
    await tools.discord_delete_own_message({ channelId: 'allowed', messageId: 'm2' });
    expect(client.deleteMessage).toHaveBeenCalledWith('allowed', 'm2');
    vi.mocked(client.getMessage).mockResolvedValueOnce({ id: 'm3', content: 'user', author: { id: 'u1', username: 'player' } });
    await expect(tools.discord_delete_own_message({ channelId: 'allowed', messageId: 'm3' })).rejects.toThrow(/bot/i);
  });
});
