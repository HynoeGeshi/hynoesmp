import { describe, expect, it } from 'vitest';
import { consentLoginUrl, normalizeAuthorizationId } from '../src/auth/consent';

describe('OAuth consent helpers', () => {
  it('preserves authorization_id through login redirect', () => {
    expect(consentLoginUrl('abc-123')).toBe('/login?authorization_id=abc-123');
  });
  it('encodes authorization_id safely', () => {
    expect(consentLoginUrl('a/b?c=d')).toBe('/login?authorization_id=a%2Fb%3Fc%3Dd');
  });
  it('rejects missing or unreasonable IDs', () => {
    expect(() => normalizeAuthorizationId('')).toThrow();
    expect(() => normalizeAuthorizationId('x'.repeat(513))).toThrow();
  });
});
