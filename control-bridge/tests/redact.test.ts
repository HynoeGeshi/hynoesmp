import { describe, expect, it } from 'vitest';
import { redactSecrets } from '../src/security/redact';

describe('redactSecrets', () => {
  it('redacts Bloom and Discord secrets recursively', () => {
    const value = { message: 'token bloom-secret failed', nested: ['discord-secret', { x: 'safe' }] };
    expect(redactSecrets(value, ['bloom-secret', 'discord-secret'])).toEqual({
      message: 'token [REDACTED] failed', nested: ['[REDACTED]', { x: 'safe' }]
    });
  });
});
