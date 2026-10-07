export const SITE_DISPLAY_NAME_MAX_LENGTH = 24;
export const SITE_DISPLAY_NAME_RENAME_COOLDOWN_DAYS = 30;

const CONTROL_OR_INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g;
const RESERVED_NAMES = new Set(['hynoe', 'admin', 'administrator', 'mod', 'moderator', 'staff', 'owner', 'system']);

export function normalizeSiteDisplayName(input) {
  return String(input ?? '')
    .replace(CONTROL_OR_INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateSiteDisplayName(input) {
  const value = normalizeSiteDisplayName(input);
  if (!value) return { ok: false, error: 'Display name is required.' };
  if (value.length > SITE_DISPLAY_NAME_MAX_LENGTH) return { ok: false, error: 'Display name is too long.' };
  if (RESERVED_NAMES.has(value.toLowerCase())) return { ok: false, error: 'That display name is reserved.' };
  return { ok: true, value, normalized: value.toLowerCase() };
}

export function getSiteRenameEligibility(profile = {}, now = Date.now()) {
  const renameCount = Math.max(0, Number(profile.rename_count ?? 0) || 0);
  if (renameCount === 0) return { allowed: true, free_correction: true, next_allowed_at: null };
  const last = Date.parse(String(profile.last_renamed_at ?? ''));
  if (!Number.isFinite(last)) return { allowed: true, free_correction: false, next_allowed_at: null };
  const next = last + SITE_DISPLAY_NAME_RENAME_COOLDOWN_DAYS * 86_400_000;
  return {
    allowed: now >= next,
    free_correction: false,
    next_allowed_at: new Date(next).toISOString(),
  };
}
