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
    try { await probe(); return [name, 'ok'] as const; }
    catch { return [name, 'error'] as const; }
  }));
  const checks = Object.fromEntries(entries) as Record<keyof HealthProbes, 'ok' | 'error'>;
  return { ok: Object.values(checks).every((value) => value === 'ok'), checks };
}

export function defaultHealthProbes(config: AppConfig): HealthProbes {
  const bloom = createBloomClient(config);
  const discord = createDiscordClient(config);
  return {
    bloom: async () => bloom.getResources(),
    discord: async () => discord.getCurrentUser(),
    supabase: async () => {
      const response = await fetch(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Supabase JWKS unavailable');
      return response.json();
    },
  };
}
