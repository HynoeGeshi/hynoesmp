const MODERATOR_ROLES = new Set(['moderator', 'admin']);
export const SITE_MODERATION_ACTIONS = Object.freeze([
  'dashboard',
  'tombstone_message',
  'mute_user',
  'ban_user',
  'unban_user',
  'resolve_report',
  'set_announcement',
  'deactivate_announcement',
  'set_chat_pause',
  'review_help_feedback',
]);

export function isSiteModeratorRole(role) {
  return MODERATOR_ROLES.has(String(role ?? '').toLowerCase());
}

export function validateModerationAction(value) {
  const action = String(value ?? '').trim();
  if (!SITE_MODERATION_ACTIONS.includes(action)) return { ok: false, error: 'Unsupported moderation action.' };
  return { ok: true, value: action };
}

export function parseModerationUntil(value, now = Date.now(), maxDays = 30) {
  const timestamp = Date.parse(String(value ?? ''));
  const max = now + Math.max(1, Number(maxDays) || 30) * 86_400_000;
  if (!Number.isFinite(timestamp) || timestamp <= now || timestamp > max) {
    return { ok: false, error: 'Choose a valid future moderation expiry.' };
  }
  return { ok: true, value: new Date(timestamp).toISOString() };
}

export function normalizeAnnouncementInput(input = {}) {
  const body = String(input.body ?? '').replace(/\s+/g, ' ').trim();
  if (!body || body.length > 500) return { ok: false, error: 'Announcement text must be 1–500 characters.' };
  const link = String(input.link_url ?? '').trim();
  if (link && (!link.startsWith('/') || link.startsWith('//') || /[\r\n]/.test(link))) {
    return { ok: false, error: 'Announcement links must be same-site relative paths.' };
  }
  let expiresAt = null;
  if (input.expires_at) {
    const parsed = Date.parse(String(input.expires_at));
    if (!Number.isFinite(parsed) || parsed <= Date.now()) return { ok: false, error: 'Announcement expiry must be in the future.' };
    expiresAt = new Date(parsed).toISOString();
  }
  return { ok: true, value: { body, link_url: link || null, expires_at: expiresAt } };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeHelpReviewInput(input = {}) {
  const feedbackId = String(input.feedback_id ?? '').trim();
  const reviewStatus = String(input.review_status ?? '').trim();
  const reviewNote = String(input.review_note ?? '').replace(/\s+/g, ' ').trim();
  if (!UUID_RE.test(feedbackId)) return { ok:false, error:'A valid Ask Hynoe feedback id is required.' };
  if (!['reviewed','resolved','ignored'].includes(reviewStatus)) return { ok:false, error:'Choose reviewed, resolved, or ignored.' };
  if (reviewNote.length > 1000) return { ok:false, error:'Review notes must be 1000 characters or fewer.' };
  return { ok:true, value:{ feedback_id:feedbackId, review_status:reviewStatus, review_note:reviewNote || null } };
}
