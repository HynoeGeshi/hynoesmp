export function normalizeAuthorizationId(value: string | undefined | null): string {
  const normalized = (value ?? '').trim();
  if (!normalized) throw new Error('authorization_id is required');
  if (normalized.length > 512) throw new Error('authorization_id is too long');
  return normalized;
}

export function consentLoginUrl(authorizationId: string): string {
  return `/login?authorization_id=${encodeURIComponent(normalizeAuthorizationId(authorizationId))}`;
}

export function consentPageUrl(authorizationId: string): string {
  return `/oauth/consent?authorization_id=${encodeURIComponent(normalizeAuthorizationId(authorizationId))}`;
}
