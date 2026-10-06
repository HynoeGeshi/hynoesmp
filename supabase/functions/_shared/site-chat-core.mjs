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

const SITE_ORIGINS = new Set([
  'https://hynoesmp.com',
  'https://www.hynoesmp.com',
  'https://hynoesmp-social-preview.onrender.com',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAllowedSiteOrigin(origin) {
  return SITE_ORIGINS.has(String(origin ?? ''));
}

export function validateRequestId(value) {
  const normalized = String(value ?? '').trim();
  if (!UUID_RE.test(normalized)) return { ok: false, error: 'Invalid request id.' };
  return { ok: true, value: normalized };
}

export function prepareSiteMessage({ userId, profile, settings, body, reply, requestId, now = Date.now(), limits = SITE_CHAT_SERVER_LIMITS }) {
  if (!userId || !profile || profile.user_id !== userId) {
    return { ok: false, code: 'unauthorized', status: 401, error: 'Sign in is required.' };
  }
  if (settings?.posting_paused) {
    return { ok: false, code: 'chat_paused', status: 503, error: settings.pause_message || 'Global Chat is temporarily paused.' };
  }
  const message = validateMessageBody(body);
  if (!message.ok) return { ok: false, code: 'invalid_message', status: 400, error: message.error };
  const request = validateRequestId(requestId);
  if (!request.ok) return { ok: false, code: 'invalid_request_id', status: 400, error: request.error };

  const posting = canPost(profile, limits, now);
  if (!posting.ok) {
    const moderated = Boolean(profile.is_banned) || (millis(profile.muted_until) ?? 0) > now;
    return {
      ok: false,
      code: moderated ? 'posting_blocked' : 'rate_limited',
      status: moderated ? 403 : 429,
      error: posting.error,
    };
  }
  const target = validateReplyTarget(reply);
  if (!target.ok) return { ok: false, code: 'invalid_reply', status: 400, error: target.error };

  return {
    ok: true,
    row: {
      author_id: userId,
      body: message.value,
      reply_to: target.value?.id ?? null,
      request_id: request.value,
    },
  };
}
