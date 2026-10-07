import { expect, it } from 'vitest';
import { loadConfig, diagnoseConfigEnv } from '../src/config';
it('starts Discord management without Bloom credentials', () => {
  const env = { NODE_ENV: 'test', DISCORD_BOT_TOKEN: 'secret', DISCORD_GUILD_ID: 'guild', DISCORD_GUILD_MANAGEMENT_ENABLED: 'true', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', ALLOWED_SUPABASE_USER_ID: 'owner', PUBLIC_BASE_URL: 'https://bridge.example.com' } as NodeJS.ProcessEnv;
  expect(diagnoseConfigEnv(env).missing).toEqual([]);
  expect(loadConfig(env).bloomApiKey).toBe('');
});
