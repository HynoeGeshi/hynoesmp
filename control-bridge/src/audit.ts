import type { AppConfig } from './config';
import { redactSecrets } from './security/redact';

export type AuditEntry = {
  tool: string;
  status: 'success' | 'error';
  target?: string;
  detail?: unknown;
  at?: string;
};

export function auditAction(config: AppConfig, entry: AuditEntry): void {
  if (!config.auditLogEnabled) return;
  const safe = redactSecrets({ ...entry, at: entry.at ?? new Date().toISOString() }, [config.bloomApiKey, config.discordBotToken]);
  console.info(JSON.stringify({ event: 'hynoe_control_bridge_audit', ...safe as Record<string, unknown> }));
}

export function safeProviderError(config: AppConfig, error: unknown): Error {
  const redacted = redactSecrets(error instanceof Error ? error : { message: String(error) }, [config.bloomApiKey, config.discordBotToken]) as { message?: string };
  return new Error(redacted.message || 'Provider request failed');
}

export async function audited<T>(config: AppConfig, tool: string, target: string | undefined, detail: unknown, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    auditAction(config, { tool, status: 'success', target, detail });
    return result;
  } catch (error) {
    const safe = safeProviderError(config, error);
    auditAction(config, { tool, status: 'error', target, detail: { input: detail, error: safe.message } });
    throw safe;
  }
}
