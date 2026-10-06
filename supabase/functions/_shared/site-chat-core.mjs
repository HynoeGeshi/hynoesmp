export const SITE_CHAT_SERVER_LIMITS = Object.freeze({
  maxMessageLength: 300,
  minSpacingMs: 3000,
});

const CONTROL_OR_INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g;

export function normalizeMessageBody(input) {
  return String(input ?? '').trim();
}

export function validateMessageBody(input) {
  const value = normalizeMessageBody(input);
  if (!value.replace(CONTROL_OR_INVISIBLE, '').trim()) return { ok: false, error: 'Message cannot be blank.' };
  if (value.length > SITE_CHAT_SERVER_LIMITS.maxMessageLength) return { ok: false, error: 'Message is too long.' };
  return { ok: true, value };
}

function millis(value) {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function canPost(profile, limits = SITE_CHAT_SERVER_LIMITS, now = Date.now()) {
  if (!profile) return { ok: false, error: 'Profile is required.' };
  if (profile.is_banned) return { ok: false, error: 'Posting is unavailable.' };
  const mutedUntil = millis(profile.muted_until);
  if (mutedUntil != null && mutedUntil > now) return { ok: false, error: 'Posting is temporarily unavailable.' };
  const lastPost = millis(profile.last_post_at);
  const minSpacingMs = Number(limits?.minSpacingMs ?? SITE_CHAT_SERVER_LIMITS.minSpacingMs);
  if (lastPost != null && now - lastPost < minSpacingMs) return { ok: false, error: 'Please slow down.' };
  return { ok: true };
}

export function validateReplyTarget(reply) {
  if (reply == null) return { ok: true, value: null };
  if (!reply.id) return { ok: false, error: 'Reply target was not found.' };
  if (reply.deleted_at) return { ok: false, error: 'Cannot reply to a deleted message.' };
  return { ok: true, value: reply };
}
