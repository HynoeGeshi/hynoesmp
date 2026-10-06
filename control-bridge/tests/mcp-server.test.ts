import { describe, expect, it } from 'vitest';
import { TOOL_NAMES, WRITE_TOOL_NAMES } from '../src/mcp/server';

it('registers the full approved tool surface', () => {
  expect(TOOL_NAMES).toEqual([
    'hynoe_status','bloom_server_status','bloom_recent_console','bloom_send_command','bloom_power','bloom_list_files','bloom_read_file','bloom_write_file','bloom_list_backups',
    'discord_list_channels','discord_recent_messages','discord_search_recent','discord_send_message','discord_send_announcement','discord_delete_own_message',
  ]);
});

it('classifies every mutation as a write tool', () => {
  expect(WRITE_TOOL_NAMES).toEqual(new Set(['bloom_send_command','bloom_power','bloom_write_file','discord_send_message','discord_send_announcement','discord_delete_own_message']));
});
