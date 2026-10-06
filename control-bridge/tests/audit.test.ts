import { expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import { auditAction } from '../src/audit';

const config = { bloomApiKey: 'BLOOMSECRET', discordBotToken: 'DISCORDSECRET', auditLogEnabled: true } as AppConfig;

it('redacts provider secrets from audit output', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  auditAction(config, { tool: 'test', status: 'error', detail: 'BLOOMSECRET DISCORDSECRET' });
  const output = String(info.mock.calls[0][0]);
  expect(output).toContain('[REDACTED]');
  expect(output).not.toContain('BLOOMSECRET');
  expect(output).not.toContain('DISCORDSECRET');
  info.mockRestore();
});

it('drops message bodies and credential-shaped audit fields recursively', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  auditAction(config, {
    tool: 'discord_send_message', status: 'success', target: 'channel',
    detail: {
      content: 'private community message',
      password: 'password-value',
      authorization: 'Bearer secret-header',
      token: 'token-value',
      nested: { messageBody: 'another private body', channelId: 'channel', count: 2 },
    },
  });
  const output = String(info.mock.calls[0][0]);
  expect(output).not.toContain('private community message');
  expect(output).not.toContain('password-value');
  expect(output).not.toContain('secret-header');
  expect(output).not.toContain('token-value');
  expect(output).not.toContain('another private body');
  expect(output).toContain('channelId');
  expect(output).toContain('count');
  info.mockRestore();
});
