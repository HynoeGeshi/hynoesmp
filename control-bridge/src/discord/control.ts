import type { AppConfig } from '../config';
import { audited } from '../audit';
import { createDiscordTools } from '../tools/discord';
import { createDiscordClient } from './client';
import type { DiscordClient, DiscordEmbed, DiscordMessagePayload, DiscordRole } from './types';
import { ApprovalStore, approvalDigest, discordApprovals } from './approvals';

const READS = new Set(['discord_list_channels', 'discord_guild_overview', 'discord_list_roles', 'discord_list_webhooks', 'discord_channel_permissions', 'discord_activity_summary', 'discord_recent_messages', 'discord_search_recent', 'discord_capabilities']);
const DESTRUCTIVE = new Set(['discord_delete_own_message', 'discord_delete_channel', 'discord_delete_role', 'discord_timeout_member', 'discord_kick_member', 'discord_ban_member', 'discord_unban_member', 'discord_bulk_delete_member_messages', 'discord_mass_member_role_change', 'discord_remove_webhook', 'discord_reorder_roles', 'discord_publish_announcement']);
const STRUCTURAL = new Set(['discord_create_channel', 'discord_update_channel', 'discord_reorder_channels', 'discord_create_role', 'discord_update_role', 'discord_reorder_roles', 'discord_update_channel_permission', 'discord_delete_channel_permission', ...DESTRUCTIVE]);
type Input = Record<string, any>;
type Tool = (input?: Input) => Promise<any>;

function bits(value: unknown): bigint {
  if (typeof value !== 'string' || !/^\d{1,64}$/.test(value)) throw new Error('Invalid permission bitfield');
  return BigInt(value);
}

export function messagePayload(input: Input): DiscordMessagePayload {
  const embeds = (input.embeds ?? []) as DiscordEmbed[];
  if (!Array.isArray(embeds) || embeds.length > 10) throw new Error('Use at most 10 embeds');
  let characters = 0;
  for (const embed of embeds) {
    for (const [value, max] of [[embed.title, 256], [embed.description, 4096], [embed.footer?.text, 2048]] as const) {
      if (value !== undefined && (typeof value !== 'string' || value.length > max)) throw new Error('Embed text exceeds Discord limits');
      characters += value?.length ?? 0;
    }
    if ((embed.fields?.length ?? 0) > 25) throw new Error('Embed supports at most 25 fields');
    for (const field of embed.fields ?? []) {
      if (!field.name || !field.value || field.name.length > 256 || field.value.length > 1024) throw new Error('Invalid embed field');
      characters += field.name.length + field.value.length;
    }
    if (embed.color !== undefined && (!Number.isInteger(embed.color) || embed.color < 0 || embed.color > 0xffffff)) throw new Error('Invalid embed color');
    for (const url of [embed.url, embed.image?.url, embed.thumbnail?.url]) if (url && new URL(url).protocol !== 'https:') throw new Error('Embed links must use HTTPS');
  }
  if (characters > 6000) throw new Error('Combined embed text exceeds 6000 characters');
  if (input.content !== undefined && (typeof input.content !== 'string' || input.content.length > 2000)) throw new Error('Invalid message content');
  if (!input.content?.trim() && embeds.length === 0) throw new Error('Message needs content or an embed');
  if (!input.allowMassMention && /@(everyone|here)\b/i.test(input.content ?? '')) throw new Error('Mass mentions require owner approval');
  return { ...(input.content !== undefined ? { content: input.content } : {}), ...(input.embeds !== undefined ? { embeds } : {}), allowed_mentions: { parse: input.allowMassMention ? ['everyone'] : [] } };
}

export function createManagedDiscordTools(config: AppConfig, client: DiscordClient = createDiscordClient(config), approvals: ApprovalStore = discordApprovals): Record<string, Tool> {
  const raw: Record<string, Tool> = createDiscordTools(config, client) as unknown as Record<string, Tool>;
  raw.discord_send_embed = async (input = {}) => ({ message: await client.sendMessagePayload(input.channelId, messagePayload(input)) });
  raw.discord_edit_message = async (input = {}) => {
    const [me, message] = await Promise.all([client.getCurrentUser(), client.getMessage(input.channelId, input.messageId)]);
    if (message.author.id !== me.id) throw new Error('Only bot-authored messages can be edited');
    return { message: await client.editMessage(input.channelId, input.messageId, messagePayload(input)) };
  };
  raw.discord_publish_announcement = async (input = {}) => {
    const [me, message] = await Promise.all([client.getCurrentUser(), client.getMessage(input.channelId, input.messageId)]);
    if (message.author.id !== me.id) throw new Error('Only bot-authored announcements can be published');
    return { message: await client.crosspostMessage(input.channelId, input.messageId) };
  };
  raw.discord_delete_channel_permission = async (input = {}) => {
    await client.deleteChannelPermission(input.channelId, input.overwriteId, input.reason ?? 'Owner approved Hynoe permission removal');
    return { ok: true };
  };
  raw.discord_capabilities = async (input = {}) => {
    const [me, roles, channels, application] = await Promise.all([client.getCurrentUser(), client.listGuildRoles(), client.listGuildChannels(), client.getApplication()]);
    const member = await client.getGuildMember(me.id);
    const assigned = roles.filter(r => r.id === config.discordGuildId || member.roles.includes(r.id));
    const base = assigned.reduce((p, r) => p | bits(r.permissions ?? '0'), 0n);
    let effective = base;
    const channel = input.channelId ? channels.find(c => c.id === input.channelId) : undefined;
    if (channel && !(base & 8n)) {
      const overwrites = channel.permission_overwrites ?? [];
      const everyone = overwrites.find(o => o.id === config.discordGuildId && o.type === 0);
      if (everyone) effective = (effective & ~bits(everyone.deny)) | bits(everyone.allow);
      const roleOverwrites = overwrites.filter(o => o.type === 0 && member.roles.includes(o.id));
      effective = (effective & ~roleOverwrites.reduce((p, o) => p | bits(o.deny), 0n)) | roleOverwrites.reduce((p, o) => p | bits(o.allow), 0n);
      const personal = overwrites.find(o => o.type === 1 && o.id === me.id);
      if (personal) effective = (effective & ~bits(personal.deny)) | bits(personal.allow);
    }
    const required = { manageChannels: 16n, manageRoles: 1n << 28n, viewChannel: 1024n, sendMessages: 2048n, embedLinks: 16384n, readHistory: 65536n, viewAuditLog: 128n, manageGuild: 32n };
    return { guildId: config.discordGuildId, botId: me.id, applicationId: application.id, administrator: Boolean(base & 8n), permissions: Object.fromEntries(Object.entries(required).map(([name, flag]) => [name, Boolean((effective & 8n) || (effective & flag))])), highestRolePosition: Math.max(0, ...assigned.map(r => r.position ?? 0)), messageContentIntent: Boolean((application.flags ?? 0) & ((1 << 18) | (1 << 19))), channelId: input.channelId, managementEnabled: config.discordGuildManagementEnabled === true };
  };

  async function prepare(tool: string, input: Input) {
    const { dryRun: _dryRun, approvalId: _approvalId, confirmed: _confirmed, ...args } = input;
    const write = !READS.has(tool);
    if (STRUCTURAL.has(tool) && config.discordGuildManagementEnabled !== true) throw new Error('Discord guild management is disabled');
    if (write && !config.auditLogEnabled) throw new Error('Audit logging must be enabled for Discord writes');
    const channels = await client.listGuildChannels();
    function channel(id: unknown, parent = false) {
      const found = channels.find(c => c.id === id);
      if (!found) throw new Error('Channel is outside the configured Discord guild');
      if (parent && found.type !== 4) throw new Error('Parent must be a category in the configured guild');
      if (!parent && config.discordGuildManagementEnabled !== true && !config.discordAllowedChannelIds.includes(found.id)) throw new Error('Discord channel is not allowlisted');
      return found;
    }
    if (args.channelId) channel(args.channelId);
    if (args.parentId) channel(args.parentId, true);
    for (const id of args.channelIds ?? []) channel(id);
    for (const c of args.channels ?? []) { channel(c.id); if (c.parentId) channel(c.parentId, true); }
    if (tool === 'discord_publish_announcement' && channel(args.channelId).type !== 5) throw new Error('Publishing requires an announcement channel');
    let highImpact = DESTRUCTIVE.has(tool) || Boolean(args.allowMassMention) || tool === 'discord_delete_channel_permission' || (args.channels?.length ?? 0) > 10;
    if (tool === 'discord_update_channel' && args.parentId !== undefined) highImpact = true;
    if ((args.channels ?? []).some((c: Input) => c.parentId !== undefined || c.lockPermissions)) highImpact = true;
    let roles: DiscordRole[] = [];
    if (tool.includes('role') || tool.includes('permission')) {
      roles = await client.listGuildRoles();
      const [me] = await Promise.all([client.getCurrentUser()]);
      const member = await client.getGuildMember(me.id);
      const highest = Math.max(0, ...roles.filter(r => member.roles.includes(r.id)).map(r => r.position ?? 0));
      function role(id: unknown, mutable = true) {
        const r = roles.find(r => r.id === id);
        if (!r) throw new Error('Role is outside the configured Discord guild');
        if (mutable && (r.managed || (r.position ?? 0) >= highest)) throw new Error('Managed role or role hierarchy prevents this operation');
        if (mutable && r.id === config.discordGuildId && tool !== 'discord_update_role') throw new Error('Cannot delete, reorder or assign @everyone');
        return r;
      }
      if (args.roleId) {
        const r = role(args.roleId);
        if (args.permissions !== undefined && (bits(args.permissions) & ~bits(r.permissions ?? '0'))) highImpact = true;
      }
      if (tool === 'discord_create_role' && args.permissions !== undefined && bits(args.permissions) !== 0n) highImpact = true;
      for (const r of args.roles ?? []) { role(r.id); if (r.position >= highest) throw new Error('Requested position violates bot role hierarchy'); }
      if (args.overwriteId && args.type === 0) role(args.overwriteId, false);
      if (tool === 'discord_update_channel_permission') {
        const current = channel(args.channelId).permission_overwrites?.find(o => o.id === args.overwriteId);
        if (!current || current.type !== args.type || (bits(args.allow) & ~bits(current.allow)) || (bits(current.deny) & ~bits(args.deny))) highImpact = true;
      }
    }
    if (tool === 'discord_remove_webhook' && !(await client.listGuildWebhooks()).some(w => w.id === args.webhookId)) throw new Error('Webhook is outside the configured Discord guild');
    if (tool === 'discord_send_embed' || tool === 'discord_edit_message') messagePayload(args);
    // Bind approval to guild structure and access controls, but omit volatile
    // activity metadata such as last_message_id so ordinary chat does not
    // invalidate a reviewed administrative change.
    const channelState = channels.map(({ id, name, type, parent_id, position, topic, permission_overwrites, nsfw, rate_limit_per_user }) => ({
      id, name, type, parent_id, position, topic, permission_overwrites, nsfw, rate_limit_per_user,
    }));
    const roleState = roles.map(({ id, name, color, hoist, position, permissions, managed, mentionable }) => ({
      id, name, color, hoist, position, permissions, managed, mentionable,
    }));
    const digest = approvalDigest({ guildId: config.discordGuildId, tool, args, channels: channelState, roles: roleState });
    return { dryRun: true, guildId: config.discordGuildId, tool, input: args, requiresApproval: highImpact, digest, channels, roles };
  }

  return Object.fromEntries(Object.entries(raw).map(([tool, invoke]) => [tool, async (input: Input = {}) => {
    return audited(config, tool, config.discordGuildId, { dryRun: input.dryRun === true, channelId: input.channelId, roleId: input.roleId, count: input.channels?.length ?? input.userIds?.length, requestId: approvalDigest({ tool, at: Date.now() }).slice(0, 16) }, async () => {
      const preview = await prepare(tool, input);
      if (input.dryRun === true) return preview;
      if (preview.requiresApproval) approvals.consume(input.approvalId, preview.digest, config.allowedSupabaseUserId);
      // Only this trusted execution boundary supplies legacy confirmation.
      return invoke({ ...preview.input, confirmed: preview.requiresApproval });
    });
  }]));
}
