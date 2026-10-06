import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import { auditAction } from '../src/audit';

it('redacts provider secrets from audit output', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const config = { bloomApiKey: 'BLOOMSECRET', discordBotToken: 'DISCORDSECRET', auditLogEnabled: true } as AppConfig;
  auditAction(config, { tool: 'test', status: 'error', detail: 'BLOOMSECRET DISCORDSECRET' });
  const output = String(info.mock.calls[0][0]);
  expect(output).toContain('[REDACTED]');
  expect(output).not.toContain('BLOOMSECRET');
  expect(output).not.toContain('DISCORDSECRET');
});
