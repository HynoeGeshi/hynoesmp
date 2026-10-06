import { describe, expect, it } from 'vitest';
import { sanitizeAuthReturnPath } from '@/lib/auth/return-path';

describe('sanitizeAuthReturnPath', () => {
  it('allows safe internal application paths', () => {
    expect(sanitizeAuthReturnPath('/command-center')).toBe('/command-center');
    expect(sanitizeAuthReturnPath('/command-center/my-page?tab=services')).toBe(
      '/command-center/my-page?tab=services',
    );
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeAuthReturnPath('https://evil.example')).toBe('/command-center');
    expect(sanitizeAuthReturnPath('//evil.example/path')).toBe('/command-center');
    expect(sanitizeAuthReturnPath('javascript:alert(1)')).toBe('/command-center');
  });

  it('rejects auth callback loops and malformed values', () => {
    expect(sanitizeAuthReturnPath('/auth/callback?next=/auth/callback')).toBe(
      '/command-center',
    );
    expect(sanitizeAuthReturnPath('command-center')).toBe('/command-center');
    expect(sanitizeAuthReturnPath(null)).toBe('/command-center');
  });
});
