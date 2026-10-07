import { createHash, randomBytes } from 'node:crypto';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
}
export function approvalDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

// A restart discards all pending approvals. This fails closed; no credentials or
// message bodies are persisted. Deploy this bridge as one Render instance.
export class ApprovalStore {
  private entries = new Map<string, { digest: string; ownerId: string; expires: number }>();
  constructor(private now: () => number = Date.now) {}
  issue(digest: string, ownerId: string): string {
    for (const [key, value] of this.entries) if (value.expires <= this.now()) this.entries.delete(key);
    if (this.entries.size >= 100) throw new Error('Too many pending approvals');
    const id = randomBytes(32).toString('hex');
    this.entries.set(id, { digest, ownerId, expires: this.now() + 5 * 60_000 });
    return id;
  }
  consume(id: string | undefined, digest: string, ownerId: string): void {
    const entry = id ? this.entries.get(id) : undefined;
    if (!entry || entry.expires <= this.now() || entry.digest !== digest || entry.ownerId !== ownerId) throw new Error('Exact, unexpired owner approval is required; preview and approve this action in the owner dashboard');
    this.entries.delete(id!);
  }
}
const globalStore = globalThis as typeof globalThis & { hynoeDiscordApprovals?: ApprovalStore };
export const discordApprovals = globalStore.hynoeDiscordApprovals ??= new ApprovalStore();
