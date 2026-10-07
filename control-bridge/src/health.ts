import type { AppConfig } from './config';
import { createBloomClient } from './bloom/client';
import { createDiscordClient } from './discord/client';

export type HealthProbes = {
  bloom: () => Promise<unknown>;
  discord: () => Promise<unknown>;
  supabase: () => Promise<unknown>;
};

export async function runHealthChecks(probes: HealthProbes) {
  const entries = await Promise.all(Object.entries(probes).map(async ([name, probe]) => {
    try { const status = await probe(); return [name, status === 'not_configured' ? 'not_configured' : 'ok'] as const; }
    catch { return [name, 'error'] as const; }
  }));
  const checks = Object.fromEntries(entries) as Record<keyof HealthProbes, 'ok' | 'error' | 'not_configured'>;
  return { ok: Object.values(checks).every((value) => value !== 'error'), checks };
}

export function defaultHealthProbes(config: AppConfig): HealthProbes {
  const bloom = createBloomClient(config);
  const discord = createDiscordClient(config);
  return {
    bloom: async () => config.bloomApiKey && config.bloomServerId ? bloom.getResources() : 'not_configured',
    discord: async () => discord.getCurrentUser(),
    supabase: async () => {
      const response = await fetch(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Supabase JWKS unavailable');
      return response.json();
    },
  };
}
