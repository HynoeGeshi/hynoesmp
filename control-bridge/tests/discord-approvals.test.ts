import { expect, it } from 'vitest';
import { ApprovalStore, approvalDigest } from '../src/discord/approvals';
it('expires approvals and rejects use by another owner', () => {
  let now = 0; const store = new ApprovalStore(() => now);
  const id = store.issue('action', 'owner');
  expect(() => store.consume(id, 'action', 'other')).toThrow(/approval/i);
  now = 300_001;
  expect(() => store.consume(id, 'action', 'owner')).toThrow(/approval/i);
});
it('binds approvals to nested payloads regardless of property order', () => {
  expect(approvalDigest({ b: 2, a: { x: 1, y: 3 } })).toBe(approvalDigest({ a: { y: 3, x: 1 }, b: 2 }));
  expect(approvalDigest({ input: { permissions: '8' } })).not.toBe(approvalDigest({ input: { permissions: '0' } }));
});
