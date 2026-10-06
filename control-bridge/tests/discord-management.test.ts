import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { DiscordClient } from '../src/discord/types';
import { createDiscordTools } from '../src/tools/discord';

const config = { discordGuildId: 'guild', discordAllowedChannelIds: [], discordGuildManagementEnabled: true } as unknown as AppConfig;

function makeClient(): DiscordClient {
  return {
    listGuildChannels: vi.fn(async () => [{ id: 'chan', name: 'general', type: 0, permission_overwrites: [{ id: 'role', type: 0, allow: '1024', deny: '2048' }] }]),
    createGuildChannel: vi.fn(async (patch) => ({ id: 'new-channel', type: patch.type ?? 0, name: patch.name })),
    updateChannel: vi.fn(async (id, patch) => ({ id, type: patch.type ?? 0, name: patch.name })),
    reorderGuildChannels: vi.fn(async () => []),
    deleteChannel: vi.fn(async () => undefined),
    createGuildRole: vi.fn(async (patch) => ({ id: 'new-role', name: patch.name ?? 'new-role' })),
    updateGuildRole: vi.fn(async (id, patch) => ({ id, name: patch.name ?? 'Role' })),
    reorderGuildRoles: vi.fn(async () => []),
    deleteGuildRole: vi.fn(async () => undefined),
    putChannelPermission: vi.fn(async () => undefined),
    deleteChannelPermission: vi.fn(async () => undefined),
  } as unknown as DiscordClient;
}

describe('Discord structure management', () => {
  it('creates, updates, and reorders channels without destructive confirmation', async () => {
    const client = makeClient();
    const tools = createDiscordTools(config, client);
    await tools.discord_create_channel({ name: 'fitness', type: 0, parentId: 'culture', topic: 'Fitness talk' });
    await tools.discord_update_channel({ channelId: 'chan', name: 'general-chat', topic: 'Talk here' });
    await tools.discord_reorder_channels({ channels: [{ id: 'chan', position: 3 }] });
    expect(client.createGuildChannel).toHaveBeenCalledOnce();
    expect(client.updateChannel).toHaveBeenCalledOnce();
    expect(client.reorderGuildChannels).toHaveBeenCalledOnce();
  });

  it('creates, updates, and reorders low-risk roles', async () => {
    const client = makeClient();
    const tools = createDiscordTools(config, client);
    await tools.discord_create_role({ name: 'Fitness' });
    await tools.discord_update_role({ roleId: 'role', name: 'Fitness Crew' });
    await tools.discord_reorder_roles({ roles: [{ id: 'role', position: 5 }] });
    expect(client.createGuildRole).toHaveBeenCalledOnce();
    expect(client.updateGuildRole).toHaveBeenCalledOnce();
    expect(client.reorderGuildRoles).toHaveBeenCalledOnce();
  });

  it('blocks channel deletion before any provider call when confirmation is missing', async () => {
    const client = makeClient();
    await expect(createDiscordTools(config, client).discord_delete_channel({ channelId: 'chan' })).rejects.toThrow(/confirmation/i);
    expect(client.deleteChannel).not.toHaveBeenCalled();
  });

  it('blocks role deletion before any provider call when confirmation is false', async () => {
    const client = makeClient();
    await expect(createDiscordTools(config, client).discord_delete_role({ roleId: 'role', confirmed: false })).rejects.toThrow(/confirmation/i);
    expect(client.deleteGuildRole).not.toHaveBeenCalled();
  });

  it('allows narrowing a permission overwrite without confirmation', async () => {
    const client = makeClient();
    await createDiscordTools(config, client).discord_update_channel_permission({
      channelId: 'chan', overwriteId: 'role', type: 0, allow: '0', deny: '3072',
    });
    expect(client.putChannelPermission).toHaveBeenCalledOnce();
  });

  it('blocks broader permission access without confirmation and never calls provider', async () => {
    const client = makeClient();
    await expect(createDiscordTools(config, client).discord_update_channel_permission({
      channelId: 'chan', overwriteId: 'role', type: 0, allow: '3072', deny: '0',
    })).rejects.toThrow(/confirmation/i);
    expect(client.putChannelPermission).not.toHaveBeenCalled();
  });

  it('allows broader permission access only with explicit confirmation', async () => {
    const client = makeClient();
    await createDiscordTools(config, client).discord_update_channel_permission({
      channelId: 'chan', overwriteId: 'role', type: 0, allow: '3072', deny: '0', confirmed: true,
    });
    expect(client.putChannelPermission).toHaveBeenCalledOnce();
  });

  it('surfaces role hierarchy/provider errors without retrying', async () => {
    const client = makeClient();
    vi.mocked(client.updateGuildRole).mockRejectedValueOnce(new Error('Discord API request failed (403): Missing Permissions'));
    await expect(createDiscordTools(config, client).discord_update_role({ roleId: 'above-bot', name: 'Nope' })).rejects.toThrow(/403/);
    expect(client.updateGuildRole).toHaveBeenCalledTimes(1);
  });
});
