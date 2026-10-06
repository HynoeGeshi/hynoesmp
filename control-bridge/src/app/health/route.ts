import { loadConfig } from '../../config';
import { defaultHealthProbes, runHealthChecks } from '../../health';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = loadConfig();
    const result = await runHealthChecks(defaultHealthProbes(config));
    return Response.json(result, {
      status: result.ok ? 200 : 503,
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json(
      { ok: false, checks: { configuration: 'error' } },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
