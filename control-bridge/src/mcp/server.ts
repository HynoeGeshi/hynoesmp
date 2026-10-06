import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import type { AppConfig } from '../config';
import { audited } from '../audit';
import { createBloomTools } from '../tools/bloom';
import { createDiscordTools } from '../tools/discord';

export const TOOL_NAMES = [
  'hynoe_status',
  'bloom_server_status',
  'bloom_recent_console',
  'bloom_send_command',
  'bloom_power',
  'bloom_list_files',
  'bloom_read_file',
  'bloom_write_file',
  'bloom_list_backups',
  'discord_list_channels',
  'discord_guild_overview',
  'discord_list_roles',
  'discord_list_webhooks',
  'discord_channel_permissions',
  'discord_activity_summary',
  'discord_recent_messages',
  'discord_search_recent',
  'discord_send_message',
  'discord_send_announcement',
  'discord_delete_own_message',
  'discord_create_channel',
  'discord_update_channel',
  'discord_reorder_channels',
  'discord_create_role',
  'discord_update_role',
  'discord_reorder_roles',
  'discord_update_channel_permission',
  'discord_delete_channel',
  'discord_delete_role',
  'discord_timeout_member',
  'discord_kick_member',
  'discord_ban_member',
  'discord_unban_member',
  'discord_bulk_delete_member_messages',
  'discord_mass_member_role_change',
  'discord_remove_webhook',
] as const;

export const WRITE_TOOL_NAMES = new Set<string>([
  'bloom_send_command',
  'bloom_power',
  'bloom_write_file',
  'discord_send_message',
  'discord_send_announcement',
  'discord_delete_own_message',
  'discord_create_channel',
  'discord_update_channel',
  'discord_reorder_channels',
  'discord_create_role',
  'discord_update_role',
  'discord_reorder_roles',
  'discord_update_channel_permission',
  'discord_delete_channel',
  'discord_delete_role',
  'discord_timeout_member',
  'discord_kick_member',
  'discord_ban_member',
  'discord_unban_member',
  'discord_bulk_delete_member_messages',
  'discord_mass_member_role_change',
  'discord_remove_webhook',
]);

export const DESTRUCTIVE_TOOL_NAMES = new Set<string>([
  'bloom_power',
  'bloom_write_file',
  'discord_delete_own_message',
  'discord_delete_channel',
  'discord_delete_role',
  'discord_timeout_member',
  'discord_kick_member',
  'discord_ban_member',
  'discord_unban_member',
  'discord_bulk_delete_member_messages',
  'discord_mass_member_role_change',
  'discord_remove_webhook',
]);

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false } as const;
const EXTERNAL_WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } as const;

const reasonSchema = z.string().min(1).max(512).optional();
const idSchema = z.string().min(1).max(100);
const decimalBitfieldSchema = z.string().regex(/^\d+$/).max(64);
const rolePatchSchema = {
  permissions: decimalBitfieldSchema.optional(),
  color: z.number().int().min(0).max(0xffffff).optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
} as const;

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

export function createHynoeMcpHandler(config: AppConfig) {
  const bloom = createBloomTools(config);
  const discord = createDiscordTools(config);

  return createMcpHandler((server) => {
    server.registerTool('hynoe_status', {
      title: 'Hynoe Control Bridge Status',
      description: 'Show whether the Hynoe Bloom and Discord integrations are configured, without exposing credentials.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    }, async () => result({
      bridge: 'ok',
      bloomServerConfigured: Boolean(config.bloomServerId),
      discordGuildConfigured: Boolean(config.discordGuildId),
      discordGuildManagementEnabled: config.discordGuildManagementEnabled === true,
      legacyDiscordChannelCount: config.discordAllowedChannelIds.length,
    }));

    server.registerTool('bloom_server_status', {
      title: 'Bloom Server Status', description: 'Read Hynoe SMP power state and resource usage.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'bloom_server_status', config.bloomServerId, {}, () => bloom.bloom_server_status())));

    server.registerTool('bloom_recent_console', {
      title: 'Bloom Recent Console', description: 'Read a bounded set of recent Minecraft console lines.',
      inputSchema: z.object({ maxLines: z.number().int().min(1).max(100).optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_recent_console', config.bloomServerId, { maxLines: input.maxLines }, () => bloom.bloom_recent_console(input))));

    server.registerTool('bloom_send_command', {
      title: 'Send Minecraft Console Command', description: 'Send a guarded Minecraft server console command. Server power commands are blocked here.',
      inputSchema: z.object({ command: z.string().min(1).max(512) }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'bloom_send_command', config.bloomServerId, { commandLength: input.command.length }, () => bloom.bloom_send_command(input))));

    server.registerTool('bloom_power', {
      title: 'Change Bloom Server Power', description: 'Start, stop, or restart the Hynoe SMP server. Stop/restart are important destructive actions and should be reviewed by the user.',
      inputSchema: z.object({ signal: z.enum(['start', 'stop', 'restart']) }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'bloom_power', config.bloomServerId, { signal: input.signal }, () => bloom.bloom_power(input))));

    server.registerTool('bloom_list_files', {
      title: 'List Bloom Server Files', description: 'List files only inside approved Hynoe SMP configuration directories.',
      inputSchema: z.object({ path: z.string().optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_list_files', config.bloomServerId, { path: input.path }, () => bloom.bloom_list_files(input))));

    server.registerTool('bloom_read_file', {
      title: 'Read Bloom Server File', description: 'Read an approved text/configuration file from Hynoe SMP.',
      inputSchema: z.object({ path: z.string().min(1) }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_read_file', config.bloomServerId, { path: input.path }, () => bloom.bloom_read_file(input))));

    server.registerTool('bloom_write_file', {
      title: 'Write Bloom Server File', description: 'Replace an approved text/configuration file on Hynoe SMP. Review this action before applying.',
      inputSchema: z.object({ path: z.string().min(1), content: z.string().max(512000) }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'bloom_write_file', config.bloomServerId, { path: input.path, contentBytes: Buffer.byteLength(input.content, 'utf8') }, () => bloom.bloom_write_file(input))));

    server.registerTool('bloom_list_backups', {
      title: 'List Bloom Backups', description: 'List Hynoe SMP backup metadata. This tool cannot delete backups.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'bloom_list_backups', config.bloomServerId, {}, () => bloom.bloom_list_backups())));

    server.registerTool('discord_list_channels', {
      title: 'List Discord Channels', description: 'List Discord guild channels available to Hynoe Control.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'discord_list_channels', config.discordGuildId, {}, () => discord.discord_list_channels())));

    server.registerTool('discord_guild_overview', {
      title: 'Discord Guild Overview', description: 'Read the Hynoe Discord guild metadata, categories, channels, roles, and onboarding state.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'discord_guild_overview', config.discordGuildId, {}, () => discord.discord_guild_overview())));

    server.registerTool('discord_list_roles', {
      title: 'List Discord Roles', description: 'List roles in the Hynoe Discord guild.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'discord_list_roles', config.discordGuildId, {}, () => discord.discord_list_roles())));

    server.registerTool('discord_list_webhooks', {
      title: 'List Discord Webhooks', description: 'List Discord webhook metadata for integration inspection.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'discord_list_webhooks', config.discordGuildId, {}, () => discord.discord_list_webhooks())));

    server.registerTool('discord_channel_permissions', {
      title: 'Inspect Discord Channel Permissions', description: 'Inspect permission overwrites on one Discord channel.',
      inputSchema: z.object({ channelId: idSchema }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_channel_permissions', input.channelId, {}, () => discord.discord_channel_permissions(input))));

    server.registerTool('discord_activity_summary', {
      title: 'Discord Activity Summary', description: 'Return bounded aggregate channel activity metrics without member profiling.',
      inputSchema: z.object({ channelIds: z.array(idSchema).max(25).optional(), perChannelLimit: z.number().int().min(1).max(100).optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_activity_summary', config.discordGuildId, { channelCount: input.channelIds?.length, perChannelLimit: input.perChannelLimit }, () => discord.discord_activity_summary(input))));

    server.registerTool('discord_recent_messages', {
      title: 'Read Recent Discord Messages', description: 'Read a bounded recent-message window from one Hynoe Discord channel.',
      inputSchema: z.object({ channelId: idSchema, limit: z.number().int().min(1).max(100).optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_recent_messages', input.channelId, { limit: input.limit }, () => discord.discord_recent_messages(input))));

    server.registerTool('discord_search_recent', {
      title: 'Search Recent Discord Messages', description: 'Search a bounded recent-message window across Hynoe Discord channels.',
      inputSchema: z.object({ query: z.string().min(1).max(200), channelId: idSchema.optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_search_recent', input.channelId ?? config.discordGuildId, { queryLength: input.query.length, channelId: input.channelId }, () => discord.discord_search_recent(input))));

    server.registerTool('discord_send_message', {
      title: 'Send Discord Message', description: 'Send a message to a Hynoe Discord channel. Mass mentions are disabled unless explicitly requested.',
      inputSchema: z.object({ channelId: idSchema, content: z.string().min(1).max(2000), allowMassMention: z.boolean().optional() }), annotations: EXTERNAL_WRITE,
    }, async (input) => result(await audited(config, 'discord_send_message', input.channelId, { contentBytes: Buffer.byteLength(input.content, 'utf8'), allowMassMention: input.allowMassMention }, () => discord.discord_send_message(input))));

    server.registerTool('discord_send_announcement', {
      title: 'Send Discord Announcement', description: 'Send an announcement. @everyone/@here requires explicit mass-mention approval.',
      inputSchema: z.object({ channelId: idSchema, content: z.string().min(1).max(2000), allowMassMention: z.boolean().optional() }), annotations: EXTERNAL_WRITE,
    }, async (input) => result(await audited(config, 'discord_send_announcement', input.channelId, { contentBytes: Buffer.byteLength(input.content, 'utf8'), allowMassMention: input.allowMassMention }, () => discord.discord_send_announcement(input))));

    server.registerTool('discord_delete_own_message', {
      title: 'Delete Bot Discord Message', description: 'Delete a message only if it was authored by the Hynoe bot.',
      inputSchema: z.object({ channelId: idSchema, messageId: idSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_delete_own_message', input.channelId, { messageId: input.messageId }, () => discord.discord_delete_own_message(input))));

    server.registerTool('discord_create_channel', {
      title: 'Create Discord Channel', description: 'Create a reversible Hynoe community channel or category.',
      inputSchema: z.object({ name: z.string().min(1).max(100), type: z.number().int().min(0).max(15).optional(), parentId: idSchema.nullable().optional(), topic: z.string().max(1024).nullable().optional(), position: z.number().int().min(0).optional(), reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_create_channel', config.discordGuildId, { name: input.name, type: input.type, parentId: input.parentId }, () => discord.discord_create_channel(input))));

    server.registerTool('discord_update_channel', {
      title: 'Update Discord Channel', description: 'Rename, move, or update a Hynoe Discord channel without deleting its history.',
      inputSchema: z.object({ channelId: idSchema, name: z.string().min(1).max(100).optional(), topic: z.string().max(1024).nullable().optional(), parentId: idSchema.nullable().optional(), position: z.number().int().min(0).optional(), reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_update_channel', input.channelId, { name: input.name, parentId: input.parentId, position: input.position }, () => discord.discord_update_channel(input))));

    server.registerTool('discord_reorder_channels', {
      title: 'Reorder Discord Channels', description: 'Reorder or move Discord channels/categories without deleting history.',
      inputSchema: z.object({ channels: z.array(z.object({ id: idSchema, position: z.number().int().min(0).optional(), parentId: idSchema.nullable().optional(), lockPermissions: z.boolean().optional() })).min(1).max(100), reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_reorder_channels', config.discordGuildId, { count: input.channels.length }, () => discord.discord_reorder_channels(input))));

    server.registerTool('discord_create_role', {
      title: 'Create Discord Role', description: 'Create a low-risk Discord role.',
      inputSchema: z.object({ name: z.string().min(1).max(100), ...rolePatchSchema, reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_create_role', config.discordGuildId, { name: input.name }, () => discord.discord_create_role(input))));

    server.registerTool('discord_update_role', {
      title: 'Update Discord Role', description: 'Update a low-risk Discord role. Discord role hierarchy limits still apply.',
      inputSchema: z.object({ roleId: idSchema, name: z.string().min(1).max(100).optional(), ...rolePatchSchema, reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_update_role', input.roleId, { name: input.name }, () => discord.discord_update_role(input))));

    server.registerTool('discord_reorder_roles', {
      title: 'Reorder Discord Roles', description: 'Reorder manageable Discord roles. Discord role hierarchy limits still apply.',
      inputSchema: z.object({ roles: z.array(z.object({ id: idSchema, position: z.number().int().min(0) })).min(1).max(100), reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_reorder_roles', config.discordGuildId, { count: input.roles.length }, () => discord.discord_reorder_roles(input))));

    server.registerTool('discord_update_channel_permission', {
      title: 'Update Discord Channel Permission', description: 'Update one channel permission overwrite. Any access broadening requires explicit confirmation at runtime.',
      inputSchema: z.object({ channelId: idSchema, overwriteId: idSchema, type: z.union([z.literal(0), z.literal(1)]), allow: decimalBitfieldSchema, deny: decimalBitfieldSchema, confirmed: z.boolean().optional(), reason: reasonSchema }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'discord_update_channel_permission', input.channelId, { overwriteId: input.overwriteId, type: input.type, confirmed: input.confirmed }, () => discord.discord_update_channel_permission(input))));

    server.registerTool('discord_delete_channel', {
      title: 'Delete Discord Channel', description: 'Permanently delete a Discord channel/category. Explicit confirmation is required.',
      inputSchema: z.object({ channelId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_delete_channel', input.channelId, { confirmed: input.confirmed }, () => discord.discord_delete_channel(input))));

    server.registerTool('discord_delete_role', {
      title: 'Delete Discord Role', description: 'Permanently delete a Discord role. Explicit confirmation is required.',
      inputSchema: z.object({ roleId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_delete_role', input.roleId, { confirmed: input.confirmed }, () => discord.discord_delete_role(input))));

    server.registerTool('discord_timeout_member', {
      title: 'Timeout Discord Member', description: 'Apply or clear a member timeout. Explicit confirmation is required.',
      inputSchema: z.object({ userId: idSchema, until: z.string().datetime({ offset: true }).nullable(), confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_timeout_member', input.userId, { confirmed: input.confirmed, until: input.until }, () => discord.discord_timeout_member(input))));

    server.registerTool('discord_kick_member', {
      title: 'Kick Discord Member', description: 'Kick a member from the Hynoe Discord. Explicit confirmation is required.',
      inputSchema: z.object({ userId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_kick_member', input.userId, { confirmed: input.confirmed }, () => discord.discord_kick_member(input))));

    server.registerTool('discord_ban_member', {
      title: 'Ban Discord Member', description: 'Ban a member from the Hynoe Discord. Explicit confirmation is required.',
      inputSchema: z.object({ userId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_ban_member', input.userId, { confirmed: input.confirmed }, () => discord.discord_ban_member(input))));

    server.registerTool('discord_unban_member', {
      title: 'Unban Discord Member', description: 'Unban a member. Explicit confirmation is required by the fail-closed management policy.',
      inputSchema: z.object({ userId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_unban_member', input.userId, { confirmed: input.confirmed }, () => discord.discord_unban_member(input))));

    server.registerTool('discord_bulk_delete_member_messages', {
      title: 'Bulk Delete Discord Member Messages', description: 'Delete 2-100 selected member-authored messages. Explicit confirmation is required.',
      inputSchema: z.object({ channelId: idSchema, messageIds: z.array(idSchema).min(2).max(100), confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_bulk_delete_member_messages', input.channelId, { count: input.messageIds.length, confirmed: input.confirmed }, () => discord.discord_bulk_delete_member_messages(input))));

    server.registerTool('discord_mass_member_role_change', {
      title: 'Mass Discord Member Role Change', description: 'Add or remove one role for up to 100 members. Explicit confirmation is required.',
      inputSchema: z.object({ userIds: z.array(idSchema).min(1).max(100), roleId: idSchema, operation: z.enum(['add', 'remove']), confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_mass_member_role_change', input.roleId, { count: input.userIds.length, operation: input.operation, confirmed: input.confirmed }, () => discord.discord_mass_member_role_change(input))));

    server.registerTool('discord_remove_webhook', {
      title: 'Remove Discord Webhook', description: 'Delete a Discord webhook/integration. Explicit confirmation is required.',
      inputSchema: z.object({ webhookId: idSchema, confirmed: z.boolean(), reason: reasonSchema }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_remove_webhook', input.webhookId, { confirmed: input.confirmed }, () => discord.discord_remove_webhook(input))));
  }, {
    serverInfo: { name: 'hynoe-control-bridge', version: '0.2.0' },
    instructions: 'Owner-only Hynoe Control bridge for Bloom and guild-wide Discord administration. Routine reversible changes may execute normally; high-impact moderation, deletion, member-content removal, and access broadening require explicit user confirmation. Never request or reveal provider credentials.',
    verboseLogs: false,
  });
}
