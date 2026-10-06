export type OAuthPublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

function required(env: NodeJS.ProcessEnv, key: 'SUPABASE_URL' | 'SUPABASE_PUBLISHABLE_KEY'): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function loadOAuthPublicConfig(env: NodeJS.ProcessEnv = process.env): OAuthPublicConfig {
  const supabaseUrl = required(env, 'SUPABASE_URL');
  const parsed = new URL(supabaseUrl);
  if (parsed.protocol !== 'https:') throw new Error('SUPABASE_URL must use https');
  return {
    supabaseUrl: parsed.origin,
    supabasePublishableKey: required(env, 'SUPABASE_PUBLISHABLE_KEY'),
  };
}
