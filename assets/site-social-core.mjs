export const SITE_CHAT_LIMITS = Object.freeze({
  maxMessageLength: 300,
  maxDisplayNameLength: 24,
});

export const SITE_DISPLAY_NAME_RENAME_COOLDOWN_DAYS = 30;

const CONTROL_OR_INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g;
const RESERVED_NAMES = new Set(['hynoe', 'admin', 'administrator', 'mod', 'moderator', 'staff', 'owner', 'system']);
const CHAT_BLOCKED_TERMS = Object.freeze([
  'nigger', 'nigga', 'faggot', 'kike', 'chink', 'gook', 'spic', 'wetback',
  'beaner', 'tranny', 'coon', 'porchmonkey', 'raghead', 'retard',
]);
const CHAT_LEET_MAP = Object.freeze({ '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '8':'b', '9':'g', '@':'a', '$':'s', '!':'i', '|':'i', '+':'t' });
const CHAT_CENSORED_TERMS = Object.freeze([
  'motherfuckers', 'motherfucker', 'motherfucking', 'motherfucked', 'motherfuck',
  'fucking', 'fucked', 'fuckers', 'fucker', 'fucks', 'fuck',
  'shitheads', 'shithead', 'shitting', 'shitty', 'shits', 'shit',
  'bitches', 'bitchy', 'bitch', 'bastards', 'bastard', 'asshole', 'assholes',
  'pissing', 'pissed', 'piss', 'dickhead', 'dickheads', 'dicks', 'dick',
  'cocks', 'cock', 'pussies', 'pussy', 'crap', 'damned', 'damn', 'hell',
]);
const CHAT_CENSORED_PATTERNS = CHAT_CENSORED_TERMS.map((term) => {
  const letters = [...term].map((char) => `${char}+`).join('[^A-Za-z0-9]*');
  return new RegExp(`(^|[^A-Za-z0-9])(${letters})(?=$|[^A-Za-z0-9])`, 'gi');
});

function comparableChatText(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .map((char) => CHAT_LEET_MAP[char] ?? char)
    .join('')
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chatTermPattern(term) {
  return new RegExp(`(?:^|\\s)${[...term].map((char) => `${char}+`).join('\\s*')}(?:$|\\s)`, 'i');
}

const CHAT_BLOCKED_PATTERNS = CHAT_BLOCKED_TERMS.map(chatTermPattern);
const CHAT_BLOCKED_PHRASES = Object.freeze([
  /(?:^|\s)k+\s*y+\s*s+(?:$|\s)/i,
  /(?:^|\s)(?:go\s+)?kill\s+yourself(?:$|\s)/i,
  /(?:^|\s)(?:i\s+will|i\s*am\s+going\s+to|i\s*ll)\s+(?:kill|hurt|shoot|stab)\s+(?:you|u|them|him|her)(?:$|\s)/i,
  /(?:^|\s)(?:send|show|give|dm|trade|share)\s+(?:me\s+)?(?:your\s+)?(?:nudes?|naked\s+pics?|dick\s+pics?|nude\s+pics?)(?:$|\s)/i,
  /(?:^|\s)(?:send|show|give|dm|trade|share)\s+(?:me\s+)?(?:your\s+)?(?:tits|boobs|ass)(?:$|\s)/i,
]);

export function containsBlockedChatContent(input) {
  const comparable = comparableChatText(input);
  return Boolean(comparable) && (
    CHAT_BLOCKED_PATTERNS.some((pattern) => pattern.test(comparable))
    || CHAT_BLOCKED_PHRASES.some((pattern) => pattern.test(comparable))
  );
}

export function censorChatProfanity(input) {
  let value = String(input ?? '');
  for (const pattern of CHAT_CENSORED_PATTERNS) {
    value = value.replace(pattern, (match, boundary, word) => boundary + word.replace(/[A-Za-z0-9]/g, '*'));
  }
  return value;
}

export function sanitizeSiteChatMessages(messages = []) {
  return (messages ?? []).flatMap((message) => {
    if (!message || typeof message !== 'object') return [];
    if (!message.is_deleted && containsBlockedChatContent(message.body)) return [];
    return [{
      ...message,
      display_name: censorChatProfanity(message.display_name),
      body: message.is_deleted ? message.body : censorChatProfanity(message.body),
    }];
  });
}

export function normalizeDisplayName(input) {
  return String(input ?? '')
    .replace(CONTROL_OR_INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateDisplayName(input) {
  const value = normalizeDisplayName(input);
  if (!value) return { ok: false, error: 'Display name is required.' };
  if (value.length > SITE_CHAT_LIMITS.maxDisplayNameLength) return { ok: false, error: 'Display name is too long.' };
  if (RESERVED_NAMES.has(value.toLowerCase())) return { ok: false, error: 'That display name is reserved.' };
  return { ok: true, value };
}

export function getDisplayNameRenameEligibility(profile = {}, now = Date.now()) {
  const renameCount = Math.max(0, Number(profile.renameCount ?? profile.rename_count) || 0);
  const lastRenamedAt = profile.lastRenamedAt ?? profile.last_renamed_at ?? null;
  if (renameCount === 0) {
    return { allowed: true, freeCorrection: true, nextAllowedAt: null };
  }
  const last = Date.parse(String(lastRenamedAt ?? ''));
  if (!Number.isFinite(last)) {
    return { allowed: true, freeCorrection: false, nextAllowedAt: null };
  }
  const next = last + SITE_DISPLAY_NAME_RENAME_COOLDOWN_DAYS * 86_400_000;
  return {
    allowed: now >= next,
    freeCorrection: false,
    nextAllowedAt: new Date(next).toISOString(),
  };
}

function hasVisibleContent(value) {
  return value.replace(CONTROL_OR_INVISIBLE, '').trim().length > 0;
}

export function validateClientMessage(input) {
  const value = String(input ?? '').trim();
  if (!hasVisibleContent(value)) return { ok: false, error: 'Message cannot be blank.' };
  if (value.length > SITE_CHAT_LIMITS.maxMessageLength) return { ok: false, error: 'Message is too long.' };
  return { ok: true, value };
}

export function computeUnread(state, event) {
  if (!event || event.type !== 'message') return Math.max(0, Number(state?.count) || 0);
  if (state?.panelOpen && state?.activeTab === 'global') return 0;
  return Math.max(0, Number(state?.count) || 0) + 1;
}

export function mergeMessageLists(current = [], incoming = [], maxMessages = 100) {
  const byId = new Map();
  for (const item of current ?? []) if (item?.id) byId.set(item.id, item);
  for (const item of incoming ?? []) if (item?.id) byId.set(item.id, item);
  return [...byId.values()]
    .sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')) || String(a.id).localeCompare(String(b.id)))
    .slice(-Math.max(1, Number(maxMessages) || 100));
}

export function presenceOnlineCount(state) {
  if (!state || typeof state !== 'object') return 0;
  return new Set(Object.keys(state).filter(Boolean)).size;
}

export const SITE_REACTIONS = Object.freeze(['like', 'love', 'laugh', 'fire', 'wow']);
export const SITE_REPORT_REASONS = Object.freeze(['spam', 'harassment', 'hate', 'unsafe', 'other']);

export function validateReaction(value) {
  const reaction = String(value ?? '').trim().toLowerCase();
  if (!SITE_REACTIONS.includes(reaction)) return { ok: false, error: 'Unsupported reaction.' };
  return { ok: true, value: reaction };
}

export function validateReport(reason, details = '') {
  const normalizedReason = String(reason ?? '').trim().toLowerCase();
  const normalizedDetails = String(details ?? '').trim();
  if (!SITE_REPORT_REASONS.includes(normalizedReason)) return { ok: false, error: 'Choose a valid report reason.' };
  if (normalizedDetails.length > 500) return { ok: false, error: 'Report details are too long.' };
  return { ok: true, value: { reason: normalizedReason, details: normalizedDetails || null } };
}

export function messageDisplayBody(message) {
  if (message?.is_deleted || message?.deleted_at) return 'Message removed by moderation.';
  if (containsBlockedChatContent(message?.body)) return 'Message hidden by the language filter.';
  return censorChatProfanity(message?.body);
}

export function isAnnouncementActive(announcement, now = Date.now()) {
  if (!announcement?.active) return false;
  if (!announcement.expires_at) return true;
  const expiry = Date.parse(announcement.expires_at);
  return Number.isFinite(expiry) && expiry > now;
}
