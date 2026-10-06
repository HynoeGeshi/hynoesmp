import { describe, expect, it } from 'vitest';
import { runHealthChecks } from '../src/health';

it('reports each dependency without leaking exception details', async () => {
  const result = await runHealthChecks({
    bloom: async () => ({ ok: true }),
    discord: async () => { throw new Error('token-secret'); },
    supabase: async () => ({ ok: true }),
  });
  expect(result.ok).toBe(false);
  expect(result.checks).toEqual({ bloom: 'ok', discord: 'error', supabase: 'ok' });
  expect(JSON.stringify(result)).not.toContain('token-secret');
});
