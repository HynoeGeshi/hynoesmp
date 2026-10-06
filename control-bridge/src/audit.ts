import type { AppConfig } from './config';
import { redactSecrets } from './security/redact';

export type AuditEntry = {
  tool: string;
  status: 'success' | 'error';
  target?: string;
  detail?: unknown;
  at?: string;
};

const SENSITIVE_AUDIT_KEY = /^(?:content|messageBody|body|password|authorization|token|secret|apiKey|cookie|set-cookie)$/i;

function sanitizeAuditDetail(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditDetail(item));
  if (value == null || typeof value !== 'object' || value instanceof Error) return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_AUDIT_KEY.test(key)) continue;
    output[key] = sanitizeAuditDetail(item);
  }
  return output;
}

export function auditAction(config: AppConfig, entry: AuditEntry): void {
  if (!config.auditLogEnabled) return;
  const sanitized = { ...entry, detail: sanitizeAuditDetail(entry.detail), at: entry.at ?? new Date().toISOString() };
  const safe = redactSecrets(sanitized, [config.bloomApiKey, config.discordBotToken]);
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
