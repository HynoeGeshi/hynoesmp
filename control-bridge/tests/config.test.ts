import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

describe('loadConfig', () => {
  it('loadConfig_rejects_missing_required_server_secrets', () => {
    expect(() => loadConfig({} as NodeJS.ProcessEnv)).toThrow(/BLOOM_API_KEY/);
  });

  it('loadConfig_parses_comma_separated_discord_channel_ids', () => {
    const config = loadConfig({
      BLOOM_API_KEY: 'bloom', BLOOM_SERVER_ID: 'server', DISCORD_BOT_TOKEN: 'discord',
      DISCORD_GUILD_ID: 'guild', DISCORD_ALLOWED_CHANNEL_IDS: '1, 2,3',
      SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'pub',
      ALLOWED_SUPABASE_USER_ID: 'user', PUBLIC_BASE_URL: 'https://bridge.example.com'
    } as NodeJS.ProcessEnv);
    expect(config.discordAllowedChannelIds).toEqual(['1', '2', '3']);
  });

  it('loadConfig_forces_bloom_panel_to_https', () => {
    const env = {
      BLOOM_API_KEY: 'bloom', BLOOM_SERVER_ID: 'server', DISCORD_BOT_TOKEN: 'discord',
      DISCORD_GUILD_ID: 'guild', DISCORD_ALLOWED_CHANNEL_IDS: '1',
      SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'pub',
      ALLOWED_SUPABASE_USER_ID: 'user', PUBLIC_BASE_URL: 'https://bridge.example.com',
      BLOOM_PANEL_URL: 'http://mc.bloom.host'
    } as NodeJS.ProcessEnv;
    expect(() => loadConfig(env)).toThrow(/https/);
  });
});
