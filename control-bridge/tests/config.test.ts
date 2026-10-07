import { describe, expect, it } from 'vitest';
import { diagnoseConfigEnv, loadConfig } from '../src/config';

function baseEnv(): NodeJS.ProcessEnv {
  return {
    BLOOM_API_KEY: 'bloom',
    BLOOM_SERVER_ID: 'server',
    DISCORD_BOT_TOKEN: 'discord',
    DISCORD_GUILD_ID: 'guild',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    ALLOWED_SUPABASE_USER_ID: 'user',
    PUBLIC_BASE_URL: 'https://bridge.example.com',
  } as unknown as NodeJS.ProcessEnv;
}

describe('loadConfig', () => {
  it('loadConfig_rejects_missing_required_server_secrets', () => {
    expect(() => loadConfig({} as unknown as NodeJS.ProcessEnv)).toThrow(/DISCORD_BOT_TOKEN/);
  });

  it('reports only missing configuration names for safe production diagnosis', () => {
    const env = {
      ...baseEnv(),
      DISCORD_GUILD_MANAGEMENT_ENABLED: 'true',
      BLOOM_API_KEY: '',
      DISCORD_BOT_TOKEN: '',
    } as NodeJS.ProcessEnv;
    expect(diagnoseConfigEnv(env)).toEqual({ missing: ['DISCORD_BOT_TOKEN'] });
    expect(JSON.stringify(diagnoseConfigEnv(env))).not.toContain('server');
  });

  it('enables guild management without a legacy channel allowlist', () => {
    const config = loadConfig({ ...baseEnv(), DISCORD_GUILD_MANAGEMENT_ENABLED: 'true' });
    expect(config.discordGuildManagementEnabled).toBe(true);
    expect(config.discordAllowedChannelIds).toEqual([]);
  });

  it('keeps legacy comma-separated channel allowlist parsing when present', () => {
    const config = loadConfig({ ...baseEnv(), DISCORD_GUILD_MANAGEMENT_ENABLED: 'true', DISCORD_ALLOWED_CHANNEL_IDS: '1, 2,3' });
    expect(config.discordAllowedChannelIds).toEqual(['1', '2', '3']);
  });

  it('requires an allowlist when guild management is disabled', () => {
    expect(() => loadConfig(baseEnv())).toThrow(/DISCORD_ALLOWED_CHANNEL_IDS/);
  });

  it('loadConfig_forces_bloom_panel_to_https', () => {
    const env = { ...baseEnv(), DISCORD_ALLOWED_CHANNEL_IDS: '1', BLOOM_PANEL_URL: 'http://mc.bloom.host' };
    expect(() => loadConfig(env)).toThrow(/https/);
  });
});
