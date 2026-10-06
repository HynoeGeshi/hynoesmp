import { describe, expect, it } from 'vitest';
import type { AppConfig } from '../src/config';
import { assertAllowedServer } from '../src/policy/server-policy';
import {
  assertAllowedChannel,
  assertDiscordActionAllowed,
  classifyDiscordAction,
  type DiscordActionName,
} from '../src/policy/discord-policy';
import { normalizeAllowedFilePath } from '../src/policy/file-policy';
import { assertAllowedCommand, assertAllowedPowerSignal } from '../src/policy/command-policy';

const legacyConfig = { bloomServerId: 'srv-1', discordAllowedChannelIds: ['10', '20'], discordGuildManagementEnabled: false } as unknown as AppConfig;
const guildConfig = { bloomServerId: 'srv-1', discordAllowedChannelIds: [], discordGuildManagementEnabled: true } as unknown as AppConfig;

describe('bridge policies', () => {
  it('accepts only the configured Bloom server', () => {
    expect(() => assertAllowedServer('srv-1', legacyConfig)).not.toThrow();
    expect(() => assertAllowedServer('srv-2', legacyConfig)).toThrow(/server/i);
  });

  it('keeps legacy channel allowlisting when guild management is disabled', () => {
    expect(() => assertAllowedChannel('10', legacyConfig)).not.toThrow();
    expect(() => assertAllowedChannel('99', legacyConfig)).toThrow(/channel/i);
  });

  it('allows guild channels when guild management is enabled', () => {
    expect(() => assertAllowedChannel('99', guildConfig)).not.toThrow();
  });

  it.each<DiscordActionName>([
    'guild_overview',
    'list_roles',
    'list_webhooks',
    'channel_permissions',
    'activity_summary',
  ])('classifies %s as read', (action) => {
    expect(classifyDiscordAction(action)).toBe('read');
    expect(() => assertDiscordActionAllowed(action, {})).not.toThrow();
  });

  it.each<DiscordActionName>([
    'create_channel',
    'update_channel',
    'reorder_channels',
    'create_role',
    'update_role',
    'reorder_roles',
    'send_message',
  ])('classifies %s as routine-write and allows it without confirmation', (action) => {
    expect(classifyDiscordAction(action)).toBe('routine-write');
    expect(() => assertDiscordActionAllowed(action, {})).not.toThrow();
  });

  it.each<DiscordActionName>([
    'delete_channel',
    'delete_role',
    'kick_member',
    'ban_member',
    'timeout_member',
    'bulk_delete_member_messages',
    'mass_member_role_change',
    'broaden_permissions',
    'remove_webhook',
  ])('requires confirmation for high-impact action %s', (action) => {
    expect(classifyDiscordAction(action)).toBe('high-impact');
    expect(() => assertDiscordActionAllowed(action, {})).toThrow(/confirmation/i);
    expect(() => assertDiscordActionAllowed(action, { confirmed: false })).toThrow(/confirmation/i);
    expect(() => assertDiscordActionAllowed(action, { confirmed: true })).not.toThrow();
  });

  it.each(['/server.properties', '/config/test.toml', '/datapacks/foo/data/test/functions/a.mcfunction'])('allows approved text paths %s', (p) => {
    expect(normalizeAllowedFilePath(p)).toBe(p.replace(/^\//, ''));
  });
  it.each(['../../etc/passwd','/%2e%2e/%2e%2e/etc/passwd','/config/%252e%252e/server.jar','/etc/passwd','/proc/self/environ','/plugins/mod.jar','/world/r.0.0.mca','/config/a\0.txt'])('blocks unsafe path %s', (p) => {
    expect(() => normalizeAllowedFilePath(p)).toThrow();
  });
  it.each(['list','say hello world','data get entity @p','function hynoe:test','scoreboard players list'])('allows normal Minecraft command %s', (cmd) => {
    expect(() => assertAllowedCommand(cmd)).not.toThrow();
  });
  it.each(['stop','kill','restart','say hi\nstop','say hi && bash','`whoami`','$(curl x)','powershell whoami'])('blocks dangerous command %s', (cmd) => {
    expect(() => assertAllowedCommand(cmd)).toThrow();
  });
  it.each(['start','stop','restart'])('allows supported power signal %s', (signal) => {
    expect(() => assertAllowedPowerSignal(signal)).not.toThrow();
  });
  it('blocks kill power signal', () => expect(() => assertAllowedPowerSignal('kill')).toThrow());
});
