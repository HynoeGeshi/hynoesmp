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
  'discord_recent_messages',
  'discord_search_recent',
  'discord_send_message',
  'discord_send_announcement',
  'discord_delete_own_message',
] as const;

export const WRITE_TOOL_NAMES = new Set<string>([
  'bloom_send_command',
  'bloom_power',
  'bloom_write_file',
  'discord_send_message',
  'discord_send_announcement',
  'discord_delete_own_message',
]);

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false } as const;
const EXTERNAL_WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } as const;

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
    }, async () => result({ bridge: 'ok', bloomServerConfigured: Boolean(config.bloomServerId), discordChannelCount: config.discordAllowedChannelIds.length }));

    server.registerTool('bloom_server_status', {
      title: 'Bloom Server Status', description: 'Read Hynoe SMP power state and resource usage.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'bloom_server_status', config.bloomServerId, {}, () => bloom.bloom_server_status())));

    server.registerTool('bloom_recent_console', {
      title: 'Bloom Recent Console', description: 'Read a bounded set of recent Minecraft console lines.',
      inputSchema: z.object({ maxLines: z.number().int().min(1).max(100).optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_recent_console', config.bloomServerId, input, () => bloom.bloom_recent_console(input))));

    server.registerTool('bloom_send_command', {
      title: 'Send Minecraft Console Command', description: 'Send a guarded Minecraft server console command. Server power commands are blocked here.',
      inputSchema: z.object({ command: z.string().min(1).max(512) }), annotations: WRITE,
    }, async (input) => result(await audited(config, 'bloom_send_command', config.bloomServerId, input, () => bloom.bloom_send_command(input))));

    server.registerTool('bloom_power', {
      title: 'Change Bloom Server Power', description: 'Start, stop, or restart the Hynoe SMP server. Stop/restart are important destructive actions and should be reviewed by the user.',
      inputSchema: z.object({ signal: z.enum(['start', 'stop', 'restart']) }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'bloom_power', config.bloomServerId, input, () => bloom.bloom_power(input))));

    server.registerTool('bloom_list_files', {
      title: 'List Bloom Server Files', description: 'List files only inside approved Hynoe SMP configuration directories.',
      inputSchema: z.object({ path: z.string().optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_list_files', config.bloomServerId, input, () => bloom.bloom_list_files(input))));

    server.registerTool('bloom_read_file', {
      title: 'Read Bloom Server File', description: 'Read an approved text/configuration file from Hynoe SMP.',
      inputSchema: z.object({ path: z.string().min(1) }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'bloom_read_file', config.bloomServerId, input, () => bloom.bloom_read_file(input))));

    server.registerTool('bloom_write_file', {
      title: 'Write Bloom Server File', description: 'Replace an approved text/configuration file on Hynoe SMP. Review this action before applying.',
      inputSchema: z.object({ path: z.string().min(1), content: z.string().max(512000) }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'bloom_write_file', config.bloomServerId, { path: input.path, contentBytes: Buffer.byteLength(input.content, 'utf8') }, () => bloom.bloom_write_file(input))));

    server.registerTool('bloom_list_backups', {
      title: 'List Bloom Backups', description: 'List Hynoe SMP backup metadata. This tool cannot delete backups.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'bloom_list_backups', config.bloomServerId, {}, () => bloom.bloom_list_backups())));

    server.registerTool('discord_list_channels', {
      title: 'List Approved Discord Channels', description: 'List only Discord channels explicitly allowlisted for this bridge.', inputSchema: z.object({}), annotations: READ_ONLY,
    }, async () => result(await audited(config, 'discord_list_channels', config.discordGuildId, {}, () => discord.discord_list_channels())));

    server.registerTool('discord_recent_messages', {
      title: 'Read Recent Discord Messages', description: 'Read recent messages from one approved Discord channel.',
      inputSchema: z.object({ channelId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_recent_messages', input.channelId, { limit: input.limit }, () => discord.discord_recent_messages(input))));

    server.registerTool('discord_search_recent', {
      title: 'Search Recent Discord Messages', description: 'Search a bounded recent-message window in approved Discord channels.',
      inputSchema: z.object({ query: z.string().min(1).max(200), channelId: z.string().optional() }), annotations: READ_ONLY,
    }, async (input) => result(await audited(config, 'discord_search_recent', input.channelId ?? config.discordGuildId, input, () => discord.discord_search_recent(input))));

    server.registerTool('discord_send_message', {
      title: 'Send Discord Message', description: 'Send a message to an approved Discord channel. Mass mentions are disabled unless explicitly requested.',
      inputSchema: z.object({ channelId: z.string().min(1), content: z.string().min(1).max(2000), allowMassMention: z.boolean().optional() }), annotations: EXTERNAL_WRITE,
    }, async (input) => result(await audited(config, 'discord_send_message', input.channelId, { contentBytes: Buffer.byteLength(input.content, 'utf8'), allowMassMention: input.allowMassMention }, () => discord.discord_send_message(input))));

    server.registerTool('discord_send_announcement', {
      title: 'Send Discord Announcement', description: 'Send an announcement to an approved Discord channel. @everyone/@here requires explicit mass-mention approval.',
      inputSchema: z.object({ channelId: z.string().min(1), content: z.string().min(1).max(2000), allowMassMention: z.boolean().optional() }), annotations: EXTERNAL_WRITE,
    }, async (input) => result(await audited(config, 'discord_send_announcement', input.channelId, { contentBytes: Buffer.byteLength(input.content, 'utf8'), allowMassMention: input.allowMassMention }, () => discord.discord_send_announcement(input))));

    server.registerTool('discord_delete_own_message', {
      title: 'Delete Bot Discord Message', description: 'Delete a message only if it was authored by the Hynoe bot.',
      inputSchema: z.object({ channelId: z.string().min(1), messageId: z.string().min(1) }), annotations: DESTRUCTIVE,
    }, async (input) => result(await audited(config, 'discord_delete_own_message', input.channelId, input, () => discord.discord_delete_own_message(input))));
  }, {
    serverInfo: { name: 'hynoe-control-bridge', version: '0.1.0' },
    instructions: 'Use only the exposed Hynoe Bloom and Discord tools. Destructive tools require user review. Never request or reveal provider credentials.',
    verboseLogs: false,
  });
}
