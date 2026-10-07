export type AppConfig = {
  bloomPanelUrl: string;
  bloomApiKey: string;
  bloomServerId: string;
  discordBotToken: string;
  discordGuildId: string;
  discordAllowedChannelIds: string[];
  discordGuildManagementEnabled?: boolean;
  supabaseUrl: string;
  supabasePublishableKey: string;
  allowedSupabaseUserId: string;
  publicBaseUrl: string;
  auditLogEnabled: boolean;
};

const REQUIRED = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'ALLOWED_SUPABASE_USER_ID',
  'PUBLIC_BASE_URL',
] as const;

function required(env: NodeJS.ProcessEnv, key: (typeof REQUIRED)[number] | 'DISCORD_ALLOWED_CHANNEL_IDS'): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function enabled(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

export function diagnoseConfigEnv(env: NodeJS.ProcessEnv = process.env): { missing: string[] } {
  const missing = REQUIRED.filter((key) => !env[key]?.trim()) as string[];
  if (!enabled(env.DISCORD_GUILD_MANAGEMENT_ENABLED) && !env.DISCORD_ALLOWED_CHANNEL_IDS?.trim()) {
    missing.push('DISCORD_ALLOWED_CHANNEL_IDS');
  }
  return { missing };
}

function assertHttps(name: string, value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${name} must be a valid URL`); }
  if (url.protocol !== 'https:') throw new Error(`${name} must use https`);
  return url.origin;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  for (const key of REQUIRED) required(env, key);
  const bloomPanelUrl = assertHttps('BLOOM_PANEL_URL', env.BLOOM_PANEL_URL?.trim() || 'https://mc.bloom.host');
  if (new URL(bloomPanelUrl).hostname !== 'mc.bloom.host') {
    throw new Error('BLOOM_PANEL_URL must point to mc.bloom.host');
  }

  const discordGuildManagementEnabled = enabled(env.DISCORD_GUILD_MANAGEMENT_ENABLED);
  const rawAllowedChannels = env.DISCORD_ALLOWED_CHANNEL_IDS?.trim() ?? '';
  const discordAllowedChannelIds = rawAllowedChannels
    ? rawAllowedChannels.split(',').map((v) => v.trim()).filter(Boolean)
    : [];
  if (!discordGuildManagementEnabled && discordAllowedChannelIds.length === 0) {
    throw new Error('Missing required environment variable: DISCORD_ALLOWED_CHANNEL_IDS');
  }

  return {
    bloomPanelUrl,
    bloomApiKey: env.BLOOM_API_KEY?.trim() ?? '',
    bloomServerId: env.BLOOM_SERVER_ID?.trim() ?? '',
    discordBotToken: required(env, 'DISCORD_BOT_TOKEN'),
    discordGuildId: required(env, 'DISCORD_GUILD_ID'),
    discordAllowedChannelIds,
    discordGuildManagementEnabled,
    supabaseUrl: assertHttps('SUPABASE_URL', required(env, 'SUPABASE_URL')),
    supabasePublishableKey: required(env, 'SUPABASE_PUBLISHABLE_KEY'),
    allowedSupabaseUserId: required(env, 'ALLOWED_SUPABASE_USER_ID'),
    publicBaseUrl: assertHttps('PUBLIC_BASE_URL', required(env, 'PUBLIC_BASE_URL')),
    auditLogEnabled: (env.AUDIT_LOG_ENABLED ?? 'true').trim().toLowerCase() !== 'false',
  };
}
