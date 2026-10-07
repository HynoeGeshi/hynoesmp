import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { DiscordClient } from '../src/discord/types';
import { createManagedDiscordTools } from '../src/discord/control';
import { ApprovalStore } from '../src/discord/approvals';

const config = { discordGuildId: 'guild', discordAllowedChannelIds: [], discordGuildManagementEnabled: true, auditLogEnabled: true, discordBotToken: 'SECRET', bloomApiKey: '', allowedSupabaseUserId: 'owner' } as unknown as AppConfig;
function client() {
  return {
    listGuildChannels: vi.fn(async () => [{ id: 'c1', type: 0, name: 'general' }, { id: 'cat', type: 4, name: 'Community' }]),
    listGuildRoles: vi.fn(async () => [{ id: 'guild', name: '@everyone', position: 0, permissions: '1024' }, { id: 'r1', name: 'Member', position: 1, permissions: '0' }, { id: 'botrole', name: 'Bot', position: 10, permissions: '8', managed: true }]),
    getCurrentUser: vi.fn(async () => ({ id: 'bot' })),
    getGuildMember: vi.fn(async () => ({ roles: ['botrole'] })),
    createGuildChannel: vi.fn(async (patch) => ({ id: 'new', ...patch })),
    updateChannel: vi.fn(async (id, patch) => ({ id, type: 0, ...patch })),
    deleteChannel: vi.fn(async () => undefined),
    updateGuildRole: vi.fn(async (id, patch) => ({ id, name: 'Member', ...patch })),
    createGuildRole: vi.fn(async (patch) => ({ id: 'newrole', ...patch })),
    putChannelPermission: vi.fn(async () => undefined),
    getMessage: vi.fn(async () => ({ id: 'm1', author: { id: 'bot' } })),
    sendMessagePayload: vi.fn(async () => ({ id: 'm1', author: { id: 'bot' } })),
    editMessage: vi.fn(async () => ({ id: 'm1', author: { id: 'bot' } })),
  } as unknown as DiscordClient;
}

describe('Discord control boundary', () => {
  it('rejects foreign channel IDs before provider writes', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_update_channel({ channelId: 'foreign', name: 'bad' })).rejects.toThrow(/guild/i);
    expect(c.updateChannel).not.toHaveBeenCalled();
  });
  it('rejects foreign parent categories', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_create_channel({ name: 'hello', parentId: 'foreign' })).rejects.toThrow(/guild/i);
    expect(c.createGuildChannel).not.toHaveBeenCalled();
  });
  it('previews a valid write without performing it', async () => {
    const c = client();
    const preview = await createManagedDiscordTools(config, c).discord_update_channel({ channelId: 'c1', name: 'new', dryRun: true });
    expect(preview).toMatchObject({ dryRun: true, tool: 'discord_update_channel', requiresApproval: false });
    expect(c.updateChannel).not.toHaveBeenCalled();
  });
  it('does not accept confirmed=true as proof of human approval', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_delete_channel({ channelId: 'c1', confirmed: true })).rejects.toThrow(/owner approval/i);
    expect(c.deleteChannel).not.toHaveBeenCalled();
  });
  it('binds one-use approval to the exact request and current guild state', async () => {
    const c = client(); const store = new ApprovalStore();
    const tools = createManagedDiscordTools(config, c, store);
    const preview = await tools.discord_delete_channel({ channelId: 'c1', dryRun: true });
    const approvalId = store.issue(preview.digest, 'owner');
    await expect(tools.discord_delete_channel({ channelId: 'cat', approvalId })).rejects.toThrow(/approval/i);
    await tools.discord_delete_channel({ channelId: 'c1', approvalId });
    await expect(tools.discord_delete_channel({ channelId: 'c1', approvalId })).rejects.toThrow(/approval/i);
    expect(c.deleteChannel).toHaveBeenCalledTimes(1);
  });
  it('invalidates approval after permissions or structure change', async () => {
    const c = client(); const store = new ApprovalStore(); const tools = createManagedDiscordTools(config, c, store);
    const p = await tools.discord_delete_channel({ channelId: 'c1', dryRun: true });
    const approvalId = store.issue(p.digest, 'owner');
    vi.mocked(c.listGuildChannels).mockResolvedValue([{ id: 'c1', type: 0, name: 'changed' }]);
    await expect(tools.discord_delete_channel({ channelId: 'c1', approvalId })).rejects.toThrow(/approval/i);
    expect(c.deleteChannel).not.toHaveBeenCalled();
  });
  it('requires approval for role privilege escalation', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_update_role({ roleId: 'r1', permissions: '8' })).rejects.toThrow(/owner approval/i);
    expect(c.updateGuildRole).not.toHaveBeenCalled();
  });
  it('blocks structural tools when management is disabled', async () => {
    const c = client();
    await expect(createManagedDiscordTools({ ...config, discordGuildManagementEnabled: false }, c).discord_create_channel({ name: 'oops' })).rejects.toThrow(/management/i);
    expect(c.createGuildChannel).not.toHaveBeenCalled();
  });
  it('rejects edits to managed roles before write', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_update_role({ roleId: 'botrole', name: 'oops' })).rejects.toThrow(/managed|hierarchy/i);
    expect(c.updateGuildRole).not.toHaveBeenCalled();
  });
  it('supports embeds and editing only bot-authored messages', async () => {
    const c = client(); const tools = createManagedDiscordTools(config, c);
    await tools.discord_send_embed({ channelId: 'c1', embeds: [{ title: 'Hynoe', description: 'Welcome', color: 0xd4af37 }] });
    expect(c.sendMessagePayload).toHaveBeenCalledWith('c1', expect.objectContaining({ embeds: [{ title: 'Hynoe', description: 'Welcome', color: 0xd4af37 }], allowed_mentions: { parse: [] } }));
    vi.mocked(c.getMessage).mockResolvedValue({ id: 'm1', author: { id: 'human' } });
    await expect(tools.discord_edit_message({ channelId: 'c1', messageId: 'm1', content: 'oops' })).rejects.toThrow(/bot/i);
    expect(c.editMessage).not.toHaveBeenCalled();
  });
  it('does not invalidate structural approval for ordinary message activity', async () => {
    const c = client(); const store = new ApprovalStore(); const tools = createManagedDiscordTools(config, c, store);
    const p = await tools.discord_delete_channel({ channelId: 'c1', dryRun: true });
    const approvalId = store.issue(p.digest, 'owner');
    vi.mocked(c.listGuildChannels).mockResolvedValue([{ id: 'c1', type: 0, name: 'general', last_message_id: 'new-message' }, { id: 'cat', type: 4, name: 'Community' }] as any);
    await tools.discord_delete_channel({ channelId: 'c1', approvalId });
    expect(c.deleteChannel).toHaveBeenCalledOnce();
  });
  it('requires owner approval for bot message deletion', async () => {
    const c = client();
    await expect(createManagedDiscordTools(config, c).discord_delete_own_message({ channelId: 'c1', messageId: 'm1' })).rejects.toThrow(/owner approval/i);
  });
});
