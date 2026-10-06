import { expect, it } from 'vitest';
import { DESTRUCTIVE_TOOL_NAMES, TOOL_NAMES, WRITE_TOOL_NAMES } from '../src/mcp/server';

const discordReads = [
  'discord_list_channels','discord_guild_overview','discord_list_roles','discord_list_webhooks','discord_channel_permissions','discord_activity_summary','discord_recent_messages','discord_search_recent',
];
const discordWrites = [
  'discord_send_message','discord_send_announcement','discord_delete_own_message','discord_create_channel','discord_update_channel','discord_reorder_channels','discord_create_role','discord_update_role','discord_reorder_roles','discord_update_channel_permission','discord_delete_channel','discord_delete_role','discord_timeout_member','discord_kick_member','discord_ban_member','discord_unban_member','discord_bulk_delete_member_messages','discord_mass_member_role_change','discord_remove_webhook',
];
const destructiveDiscord = [
  'discord_delete_own_message','discord_delete_channel','discord_delete_role','discord_timeout_member','discord_kick_member','discord_ban_member','discord_unban_member','discord_bulk_delete_member_messages','discord_mass_member_role_change','discord_remove_webhook',
];

it('registers the full approved tool surface', () => {
  expect(TOOL_NAMES).toEqual([
    'hynoe_status','bloom_server_status','bloom_recent_console','bloom_send_command','bloom_power','bloom_list_files','bloom_read_file','bloom_write_file','bloom_list_backups',
    ...discordReads,
    ...discordWrites,
  ]);
});

it('classifies every mutation as a write tool', () => {
  expect(WRITE_TOOL_NAMES).toEqual(new Set([
    'bloom_send_command','bloom_power','bloom_write_file', ...discordWrites,
  ]));
});

it('marks every confirmation-gated Discord tool destructive for MCP review', () => {
  for (const name of destructiveDiscord) expect(DESTRUCTIVE_TOOL_NAMES.has(name)).toBe(true);
  expect(DESTRUCTIVE_TOOL_NAMES.has('discord_create_channel')).toBe(false);
  expect(DESTRUCTIVE_TOOL_NAMES.has('discord_update_channel_permission')).toBe(false);
});
