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

  it('reads guild metadata, roles, webhooks, and onboarding from Discord v10', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await client.getGuild();
    await client.listGuildRoles();
    await client.listGuildWebhooks();
    await client.getGuildOnboarding();
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit?][];
    const urls = calls.map(([url]) => String(url));
    expect(urls[0]).toContain('/api/v10/guilds/guild-1');
    expect(urls[1]).toContain('/api/v10/guilds/guild-1/roles');
    expect(urls[2]).toContain('/api/v10/guilds/guild-1/webhooks');
    expect(urls[3]).toContain('/api/v10/guilds/guild-1/onboarding');
  });

  it('creates, edits, reorders, and deletes channels with audit-log reason support', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'chan-x', type: 0 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await client.createGuildChannel({ name: 'test', type: 0 }, 'Hynoe overhaul');
    await client.updateChannel('chan-x', { topic: 'updated' }, 'Hynoe overhaul');
    await client.reorderGuildChannels([{ id: 'chan-x', position: 2 }], 'Hynoe overhaul');
    await client.deleteChannel('chan-x', 'Hynoe overhaul');
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][1].method).toBe('POST');
    expect(calls[1][1].method).toBe('PATCH');
    expect(calls[2][1].method).toBe('PATCH');
    expect(calls[3][1].method).toBe('DELETE');
    expect(new Headers(calls[0][1].headers).get('x-audit-log-reason')).toBe('Hynoe%20overhaul');
  });

  it('creates, edits, reorders, and deletes roles', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'role-x', name: 'Role' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await client.createGuildRole({ name: 'Role' }, 'Hynoe overhaul');
    await client.updateGuildRole('role-x', { name: 'Role 2' }, 'Hynoe overhaul');
    await client.reorderGuildRoles([{ id: 'role-x', position: 4 }], 'Hynoe overhaul');
    await client.deleteGuildRole('role-x', 'Hynoe overhaul');
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([, init]) => init.method)).toEqual(['POST', 'PATCH', 'PATCH', 'DELETE']);
    expect(String(calls[1][0])).toContain('/guilds/guild-1/roles/role-x');
  });

  it('updates and removes channel permission overwrites', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await client.putChannelPermission('chan-1', 'role-x', { allow: '1024', deny: '0', type: 0 }, 'permissions');
    await client.deleteChannelPermission('chan-1', 'role-x', 'permissions');
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][1].method).toBe('PUT');
    expect(calls[1][1].method).toBe('DELETE');
    expect(String(calls[0][0])).toContain('/channels/chan-1/permissions/role-x');
  });

  it('exposes explicit moderation endpoints without retrying failed writes', async () => {
    const fetchMock = vi.fn(async () => new Response('rate limited', { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await expect(client.kickGuildMember('user-1', 'confirmed moderation')).rejects.toThrow(/429/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('supports timeout, ban, unban, member roles, bulk deletion, and webhook removal endpoints', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createDiscordClient(config);
    await client.timeoutGuildMember('user-1', '2026-10-07T00:00:00.000Z', 'confirmed');
    await client.banGuildMember('user-1', 'confirmed');
    await client.unbanGuildMember('user-1', 'confirmed');
    await client.addGuildMemberRole('user-1', 'role-1', 'confirmed');
    await client.removeGuildMemberRole('user-1', 'role-1', 'confirmed');
    await client.bulkDeleteMessages('chan-1', ['m1', 'm2'], 'confirmed');
    await client.deleteWebhook('webhook-1', 'confirmed');
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit?][];
    const urls = calls.map(([url]) => String(url));
    expect(urls).toContainEqual(expect.stringContaining('/guilds/guild-1/members/user-1'));
    expect(urls).toContainEqual(expect.stringContaining('/guilds/guild-1/bans/user-1'));
    expect(urls).toContainEqual(expect.stringContaining('/guilds/guild-1/members/user-1/roles/role-1'));
    expect(urls).toContainEqual(expect.stringContaining('/channels/chan-1/messages/bulk-delete'));
    expect(urls).toContainEqual(expect.stringContaining('/webhooks/webhook-1'));
  });
});
