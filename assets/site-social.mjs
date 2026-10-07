import { createClient } from './vendor/supabase.mjs';
import { normalizeDisplayName, validateDisplayName, validateClientMessage, validateReaction, validateReport, isAnnouncementActive } from './site-social-core.mjs';

export const SITE_SOCIAL_CONFIG_PATH = '/data/site-social-config.json';
const SESSION_RESTORE_TIMEOUT_MS = 3500;
const AUTH_ACTION_TIMEOUT_MS = 7000;

function boundedTimeout(value, fallback, max = 15000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(10, Math.min(max, parsed));
}

async function racePromise(promise, timeoutMs, timeoutValue) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((resolve) => { timer = setTimeout(() => resolve(timeoutValue), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function raceGetSession(getSession, timeoutMs = SESSION_RESTORE_TIMEOUT_MS) {
  const timedOut = Symbol('session-timeout');
  const result = await racePromise(getSession(), boundedTimeout(timeoutMs, SESSION_RESTORE_TIMEOUT_MS), timedOut);
  if (result === timedOut) return { session: null, timedOut: true };
  if (result?.error) throw new Error('Could not restore the site session.');
  return { session: result?.data?.session ?? null, timedOut: false };
}

export function clearSiteAuthStorage(config, storage) {
  let projectRef = '';
  try { projectRef = new URL(String(config?.supabaseUrl ?? '')).hostname.split('.')[0] || ''; } catch {}
  if (!projectRef) return '';
  const key = `sb-${projectRef}-auth-token`;
  let target = storage;
  if (target === undefined) {
    try { target = globalThis.localStorage; } catch { target = null; }
  }
  try { target?.removeItem?.(key); } catch {}
  return key;
}

export async function restoreSiteSession(client, { timeoutMs = SESSION_RESTORE_TIMEOUT_MS } = {}) {
  if (!client?.auth?.getSession) throw new Error('Site authentication is unavailable.');
  return raceGetSession(client.auth.getSession.bind(client.auth), timeoutMs);
}

export async function loadSiteSocialConfig(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('Site social configuration cannot be loaded.');
  const response = await fetchImpl(SITE_SOCIAL_CONFIG_PATH, { cache: 'no-store' });
  if (!response?.ok) throw new Error('Site social configuration could not be loaded.');
  const raw = await response.json();
  if (!raw?.enabled) return { enabled: false };

  const supabaseUrl = String(raw.supabaseUrl ?? '').trim();
  const supabasePublishableKey = String(raw.supabasePublishableKey ?? '').trim();
  const turnstileSiteKey = String(raw.turnstileSiteKey ?? '').trim();

  let url;
  try { url = new URL(supabaseUrl); } catch { throw new Error('Supabase URL must use HTTPS.'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) {
    throw new Error('Supabase URL must use HTTPS on a Supabase project host.');
  }
  if (!supabasePublishableKey.startsWith('sb_publishable_')) {
    throw new Error('A Supabase publishable key is required.');
  }
  return { enabled: true, supabaseUrl, supabasePublishableKey, turnstileSiteKey };
}

export function createSiteSocialClient(config, options = {}) {
  if (!config?.enabled) throw new Error('Site social features are disabled.');
  const { auth: authOptions = {}, ...clientOptions } = options;
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    ...clientOptions,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      ...authOptions,
    },
  });

  if (client?.auth?.getSession) {
    const originalGetSession = client.auth.getSession.bind(client.auth);
    client.auth.getSession = async () => {
      const restored = await raceGetSession(originalGetSession, SESSION_RESTORE_TIMEOUT_MS);
      if (restored.timedOut) {
        clearSiteAuthStorage(config);
        return { data: { session: null }, error: null };
      }
      return { data: { session: restored.session }, error: null };
    };
  }
  return client;
}

export async function ensureSiteSession(client, captchaToken) {
  if (!client?.auth?.getSession) throw new Error('Site authentication is unavailable.');
  const current = await restoreSiteSession(client);
  if (current.session) return current.session;
  if (!client.auth.signInAnonymously) throw new Error('Anonymous site authentication is unavailable.');

  const token = String(captchaToken ?? '').trim();
  const signIn = token
    ? client.auth.signInAnonymously({ options: { captchaToken: token } })
    : client.auth.signInAnonymously();
  const timeout = Symbol('anonymous-auth-timeout');
  const result = await racePromise(signIn, AUTH_ACTION_TIMEOUT_MS, timeout);
  if (result === timeout) throw new Error('Site sign-in timed out. Please try joining again.');
  const { data, error } = result ?? {};
  if (error || !data?.session) throw new Error('Site sign-in failed. Please complete verification again.');
  return data.session;
}

export async function ensureProfile(client, user, displayName) {
  if (!user?.id) throw new Error('A signed-in site user is required.');
  const checked = validateDisplayName(displayName);
  if (!checked.ok) throw new Error(checked.error);

  const table = client.from('site_profiles');
  const lookup = await table.select('user_id,display_name,normalized_name,avatar_seed').eq('user_id', user.id).maybeSingle();
  if (lookup.error) throw new Error('Could not load the site profile.');

  if (lookup.data) {
    return { ...lookup.data, avatar_seed: lookup.data.avatar_seed || user.id };
  }

  const normalized = normalizeDisplayName(checked.value).toLowerCase();
  const payload = {
    user_id: user.id,
    display_name: checked.value,
    normalized_name: normalized,
    avatar_seed: user.id,
  };
  const inserted = await table.insert([payload]);
  if (inserted?.error) {
    if (inserted.error.code === '23505') throw new Error('That display name is already taken.');
    throw new Error('Could not create the site profile.');
  }
  return payload;
}

function functionErrorMessage(error, data, fallback) {
  return data?.error || error?.context?.body?.error || error?.message || fallback;
}

export async function loadSiteProfileRenameStatus(client) {
  if (!client?.functions?.invoke) throw new Error('Name settings are unavailable.');
  const { data, error } = await client.functions.invoke('rename-site-profile', { body: { action: 'status' } });
  if (error || !data?.display_name) throw new Error(functionErrorMessage(error, data, 'Name settings could not be loaded.'));
  return data;
}

export async function renameSiteProfile(client, displayName) {
  if (!client?.functions?.invoke) throw new Error('Name changes are unavailable.');
  const checked = validateDisplayName(displayName);
  if (!checked.ok) throw new Error(checked.error);
  const { data, error } = await client.functions.invoke('rename-site-profile', {
    body: { action: 'rename', display_name: checked.value },
  });
  if (error || !data?.display_name) throw new Error(functionErrorMessage(error, data, 'Display name could not be changed.'));
  return data;
}

export async function loadRecentMessages(client, limit = 50) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const { data, error } = await client
    .from('site_chat_public_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error('Could not load Global Chat history.');
  return [...(data ?? [])].reverse();
}

export async function connectGlobalChannel(client, {
  userId,
  displayName,
  page = '/',
  onBroadcast = () => {},
  onPresence = () => {},
  refreshHistory = async () => {},
  onStatus = () => {},
} = {}) {
  if (!client?.channel || !client?.realtime) throw new Error('Realtime chat is unavailable.');
  if (!userId) throw new Error('A signed-in site user is required for realtime chat.');
  if (client.realtime.setAuth) await client.realtime.setAuth();

  const channel = client.channel('site:global', {
    config: { private: true, presence: { key: userId } },
  });

  channel.on('broadcast', { event: '*' }, (payload) => onBroadcast(payload));
  channel.on('presence', { event: 'sync' }, () => {
    onPresence(typeof channel.presenceState === 'function' ? channel.presenceState() : {});
  });

  channel.subscribe(async (status) => {
    onStatus(status);
    if (status !== 'SUBSCRIBED') return;
    await refreshHistory();
    if (channel.track) {
      await channel.track({
        user_id: userId,
        display_name: String(displayName ?? '').slice(0, 24),
        page: String(page ?? '/').slice(0, 160),
        last_seen: new Date().toISOString(),
      });
    }
  });

  return {
    channel,
    async disconnect() {
      try { if (channel.untrack) await channel.untrack(); } catch {}
      if (client.removeChannel) await client.removeChannel(channel);
      else if (channel.unsubscribe) await channel.unsubscribe();
    },
  };
}

export async function sendSiteMessage(client, { body, replyTo = null, requestId = crypto.randomUUID() } = {}) {
  const checked = validateClientMessage(body);
  if (!checked.ok) throw new Error(checked.error);
  const { data, error } = await client.functions.invoke('send-site-message', {
    body: { body: checked.value, reply_to: replyTo || null, request_id: requestId },
  });
  if (error || !data?.id) throw new Error('Message could not be sent.');
  return data;
}

export async function setMessageReaction(client, { messageId, userId, reaction, active }) {
  if (!messageId || !userId) throw new Error('A message and signed-in user are required.');
  const checked = validateReaction(reaction);
  if (!checked.ok) throw new Error(checked.error);
  if (active) {
    const { error } = await client.from('site_chat_reactions').insert([{
      message_id: messageId,
      user_id: userId,
      reaction: checked.value,
    }]);
    if (error && error.code !== '23505') throw new Error('Reaction could not be saved.');
    return;
  }
  const { error } = await client
    .from('site_chat_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('reaction', checked.value);
  if (error) throw new Error('Reaction could not be removed.');
}

export async function reportSiteMessage(client, { messageId, userId, reason, details = '' }) {
  if (!messageId || !userId) throw new Error('A message and signed-in user are required.');
  const checked = validateReport(reason, details);
  if (!checked.ok) throw new Error(checked.error);
  const { error } = await client.from('site_chat_reports').insert([{
    message_id: messageId,
    reporter_id: userId,
    reason: checked.value.reason,
    details: checked.value.details,
  }]);
  if (error && error.code !== '23505') throw new Error('Report could not be submitted.');
}

export async function loadMessageReactions(client, messageIds = []) {
  const ids = [...new Set((messageIds ?? []).filter(Boolean))].slice(0, 100);
  if (!ids.length) return [];
  const { data, error } = await client
    .from('site_chat_reactions')
    .select('message_id,user_id,reaction,created_at')
    .in('message_id', ids);
  if (error) throw new Error('Could not load reactions.');
  return data ?? [];
}

export async function loadActiveAnnouncement(client, now = Date.now()) {
  const { data, error } = await client
    .from('site_announcements')
    .select('id,body,link_url,active,created_at,expires_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Could not load the site announcement.');
  return isAnnouncementActive(data, now) ? data : null;
}

export async function sendHelpFeedback(client, { requestId, helpful }) {
  if (!client?.functions?.invoke) throw new Error('Ask Hynoe feedback is unavailable.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(requestId ?? ''))) throw new Error('Invalid Ask Hynoe request.');
  if (typeof helpful !== 'boolean') throw new Error('Feedback must be helpful or not helpful.');
  const { data, error } = await client.functions.invoke('ask-hynoe', { body: { action:'feedback', request_id:requestId, helpful } });
  if (error) throw new Error(error?.context?.body?.error || error?.message || 'Feedback could not be saved.');
  return data;
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    if (target.getAttribute('aria-label') !== 'Global Chat message') return;
    const composer = target.closest('form.site-social-composer');
    if (!composer || typeof composer.requestSubmit !== 'function') return;
    event.preventDefault();
    composer.requestSubmit();
  });

  setTimeout(() => {
    import('./site-profile-rename.mjs')
      .then(({ installSiteProfileRenameTools }) => installSiteProfileRenameTools())
      .catch(() => {});
  }, 0);
}
