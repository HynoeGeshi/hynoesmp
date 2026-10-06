import { describe, expect, it } from 'vitest';
import type { AppConfig } from '../src/config';
import { assertAllowedServer } from '../src/policy/server-policy';
import { assertAllowedChannel } from '../src/policy/discord-policy';
import { normalizeAllowedFilePath } from '../src/policy/file-policy';
import { assertAllowedCommand, assertAllowedPowerSignal } from '../src/policy/command-policy';

const config = { bloomServerId: 'srv-1', discordAllowedChannelIds: ['10', '20'] } as AppConfig;

describe('bridge policies', () => {
  it('accepts only the configured Bloom server', () => {
    expect(() => assertAllowedServer('srv-1', config)).not.toThrow();
    expect(() => assertAllowedServer('srv-2', config)).toThrow(/server/i);
  });
  it('accepts only configured Discord channels', () => {
    expect(() => assertAllowedChannel('10', config)).not.toThrow();
    expect(() => assertAllowedChannel('99', config)).toThrow(/channel/i);
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
