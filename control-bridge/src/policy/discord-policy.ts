import type { AppConfig } from '../config';

export type DiscordActionRisk = 'read' | 'routine-write' | 'high-impact';
export type DiscordActionName = string;

const READ_ACTIONS = new Set<DiscordActionName>([
  'guild_overview',
  'list_roles',
  'list_webhooks',
  'channel_permissions',
  'activity_summary',
]);

const ROUTINE_WRITE_ACTIONS = new Set<DiscordActionName>([
  'create_channel',
  'update_channel',
  'reorder_channels',
  'create_role',
  'update_role',
  'reorder_roles',
  'send_message',
]);

export function classifyDiscordAction(action: DiscordActionName): DiscordActionRisk {
  if (READ_ACTIONS.has(action)) return 'read';
  if (ROUTINE_WRITE_ACTIONS.has(action)) return 'routine-write';
  return 'high-impact';
}

export function assertDiscordActionAllowed(action: DiscordActionName, input: { confirmed?: boolean }): void {
  if (classifyDiscordAction(action) === 'high-impact' && input.confirmed !== true) {
    throw new Error(`Explicit confirmation is required for high-impact Discord action: ${action}`);
  }
}

export function assertAllowedChannel(channelId: string, config: AppConfig): void {
  if (config.discordGuildManagementEnabled === true) return;
  if (!config.discordAllowedChannelIds.includes(channelId)) throw new Error('Discord channel is not allowlisted');
}
