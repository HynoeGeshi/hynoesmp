import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { DiscordClient } from '../src/discord/types';
import { createDiscordTools } from '../src/tools/discord';

const config = { discordGuildId: 'guild', discordAllowedChannelIds: [], discordGuildManagementEnabled: true } as AppConfig;

function makeClient(): DiscordClient {
  return {
    timeoutGuildMember: vi.fn(async () => ({})),
    kickGuildMember: vi.fn(async () => undefined),
    banGuildMember: vi.fn(async () => undefined),
    unbanGuildMember: vi.fn(async () => undefined),
    deleteChannel: vi.fn(async () => undefined),
    deleteGuildRole: vi.fn(async () => undefined),
    bulkDeleteMessages: vi.fn(async () => undefined),
    addGuildMemberRole: vi.fn(async () => undefined),
    removeGuildMemberRole: vi.fn(async () => undefined),
    deleteWebhook: vi.fn(async () => undefined),
  } as unknown as DiscordClient;
}

describe('Discord high-impact tools', () => {
  it.each([
    ['timeout', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_timeout_member({ userId: 'u1', until: '2026-10-07T00:00:00Z' })],
    ['kick', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_kick_member({ userId: 'u1' })],
    ['ban', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_ban_member({ userId: 'u1' })],
    ['unban', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_unban_member({ userId: 'u1' })],
    ['channel delete', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_delete_channel({ channelId: 'c1' })],
    ['role delete', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_delete_role({ roleId: 'r1' })],
    ['member-message bulk delete', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_bulk_delete_member_messages({ channelId: 'c1', messageIds: ['m1', 'm2'] })],
    ['mass role change', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_mass_member_role_change({ userIds: ['u1', 'u2'], roleId: 'r1', operation: 'add' })],
    ['webhook removal', (tools: ReturnType<typeof createDiscordTools>) => tools.discord_remove_webhook({ webhookId: 'w1' })],
  ] as const)('blocks %s without explicit confirmation before provider writes', async (_name, invoke) => {
    const client = makeClient();
    await expect(invoke(createDiscordTools(config, client))).rejects.toThrow(/confirmation/i);
    expect(client.timeoutGuildMember).not.toHaveBeenCalled();
    expect(client.kickGuildMember).not.toHaveBeenCalled();
    expect(client.banGuildMember).not.toHaveBeenCalled();
    expect(client.unbanGuildMember).not.toHaveBeenCalled();
    expect(client.deleteChannel).not.toHaveBeenCalled();
    expect(client.deleteGuildRole).not.toHaveBeenCalled();
    expect(client.bulkDeleteMessages).not.toHaveBeenCalled();
    expect(client.addGuildMemberRole).not.toHaveBeenCalled();
    expect(client.removeGuildMemberRole).not.toHaveBeenCalled();
    expect(client.deleteWebhook).not.toHaveBeenCalled();
  });

  it('executes each confirmed moderation action exactly once', async () => {
    const client = makeClient();
    const tools = createDiscordTools(config, client);
    await tools.discord_timeout_member({ userId: 'u1', until: '2026-10-07T00:00:00Z', confirmed: true });
    await tools.discord_kick_member({ userId: 'u2', confirmed: true });
    await tools.discord_ban_member({ userId: 'u3', confirmed: true });
    await tools.discord_unban_member({ userId: 'u4', confirmed: true });
    expect(client.timeoutGuildMember).toHaveBeenCalledTimes(1);
    expect(client.kickGuildMember).toHaveBeenCalledTimes(1);
    expect(client.banGuildMember).toHaveBeenCalledTimes(1);
    expect(client.unbanGuildMember).toHaveBeenCalledTimes(1);
  });

  it('executes confirmed destructive content and integration operations only as requested', async () => {
    const client = makeClient();
    const tools = createDiscordTools(config, client);
    await tools.discord_bulk_delete_member_messages({ channelId: 'c1', messageIds: ['m1', 'm2'], confirmed: true });
    await tools.discord_remove_webhook({ webhookId: 'w1', confirmed: true });
    expect(client.bulkDeleteMessages).toHaveBeenCalledWith('c1', ['m1', 'm2'], expect.any(String));
    expect(client.deleteWebhook).toHaveBeenCalledTimes(1);
  });

  it('caps confirmed mass-role changes and performs one explicit provider action per member', async () => {
    const client = makeClient();
    const tools = createDiscordTools(config, client);
    await tools.discord_mass_member_role_change({ userIds: ['u1', 'u2'], roleId: 'r1', operation: 'add', confirmed: true });
    expect(client.addGuildMemberRole).toHaveBeenCalledTimes(2);
    await expect(tools.discord_mass_member_role_change({ userIds: Array.from({ length: 101 }, (_, i) => `u${i}`), roleId: 'r1', operation: 'remove', confirmed: true })).rejects.toThrow(/100/);
  });

  it('does not allow a confident model/content reason to substitute for confirmation', async () => {
    const client = makeClient();
    await expect(createDiscordTools(config, client).discord_ban_member({
      userId: 'u1', reason: 'Model says this is definitely spam and abuse', confirmed: false,
    })).rejects.toThrow(/confirmation/i);
    expect(client.banGuildMember).not.toHaveBeenCalled();
  });
});
