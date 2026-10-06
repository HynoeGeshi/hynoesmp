import {
  loadSiteSocialConfig,
  createSiteSocialClient,
  ensureSiteSession,
  ensureProfile,
  loadRecentMessages,
  connectGlobalChannel,
  sendSiteMessage,
  setMessageReaction,
  reportSiteMessage,
  loadMessageReactions,
  loadActiveAnnouncement,
  sendHelpFeedback,
} from './site-social.mjs';
import {
  SITE_REACTIONS,
  validateDisplayName,
  mergeMessageLists,
  presenceOnlineCount,
  messageDisplayBody,
} from './site-social-core.mjs';
import { askHynoe, appendPrivateHistory } from './ask-hynoe.mjs';

const DISPLAY_NAME_KEY = 'hynoeSiteDisplayName';
const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const reactionIcons = { like: '👍', love: '♥', laugh: '😂', fire: '🔥', wow: '✦' };

const state = {
  config: null,
  client: null,
  session: null,
  profile: null,
  channelHandle: null,
  messages: [],
  reactions: [],
  announcement: null,
  online: 0,
  unread: 0,
  replyTo: null,
  open: false,
  activeTab: 'chat',
  captchaToken: '',
  turnstileWidget: null,
  refreshBusy: false,
  askHistory: [],
  askBusy: false,
};

function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'className') node.className = value;
    else if (key === 'hidden') node.hidden = Boolean(value);
    else if (key.startsWith('data-')) node.setAttribute(key, String(value));
    else if (key === 'role' || key.startsWith('aria-')) node.setAttribute(key, String(value));
    else if (key in node && key !== 'form') node[key] = value;
    else node.setAttribute(key, String(value));
  }
  if (text) node.textContent = text;
  return node;
}

const launcher = el('button', {
  type: 'button',
  className: 'site-social-launcher',
  'aria-haspopup': 'dialog',
  'aria-expanded': 'false',
  'aria-controls': 'hynoe-community-panel',
  title: 'Open Hynoe Community',
});
launcher.append(el('span', { className: 'site-social-launcher-mark', 'aria-hidden': 'true' }, 'H'));
launcher.append(el('span', { className: 'site-social-launcher-copy' }, 'COMMUNITY'));
const unreadBadge = el('span', { className: 'site-social-unread', hidden: true, 'aria-label': 'Unread messages' }, '0');
launcher.append(unreadBadge);

const backdrop = el('button', { type: 'button', className: 'site-social-backdrop', hidden: true, 'aria-label': 'Close Hynoe Community' });
const panel = el('aside', {
  id: 'hynoe-community-panel',
  className: 'site-social-panel',
  role: 'dialog',
  'aria-modal': 'true',
  'aria-label': 'Hynoe Community',
  hidden: true,
});

const header = el('header', { className: 'site-social-head' });
const brand = el('div', { className: 'site-social-brand' });
brand.append(el('span', { className: 'site-social-brand-mark', 'aria-hidden': 'true' }, 'H'));
const brandText = el('div');
brandText.append(el('strong', {}, 'HYNOE COMMUNITY'));
brandText.append(el('small', { className: 'site-social-head-status' }, 'Connecting community tools…'));
brand.append(brandText);
const closeButton = el('button', { type: 'button', className: 'site-social-close', 'aria-label': 'Close Hynoe Community' }, '×');
header.append(brand, closeButton);
panel.append(header);

const tabs = el('div', { className: 'site-social-tabs', role: 'tablist', 'aria-label': 'Community tools' });
const chatTab = el('button', { type: 'button', role: 'tab', 'aria-selected': 'true', 'data-social-tab': 'chat' }, 'GLOBAL CHAT');
const askTab = el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', 'data-social-tab': 'ask' }, 'ASK HYNOE');
tabs.append(chatTab, askTab);
panel.append(tabs);

const body = el('div', { className: 'site-social-body' });
const chatPane = el('section', { className: 'site-social-pane', role: 'tabpanel', 'aria-label': 'Global Chat' });
const askPane = el('section', { className: 'site-social-pane', role: 'tabpanel', 'aria-label': 'Ask Hynoe', hidden: true });
body.append(chatPane, askPane);
panel.append(body);

const announcementBox = el('div', { className: 'site-social-announcement', hidden: true });
const announcementText = el('p');
const announcementLink = el('a', { hidden: true });
announcementBox.append(announcementText, announcementLink);
chatPane.append(announcementBox);

const chatMeta = el('div', { className: 'site-social-meta' });
const connectionText = el('span', { className: 'site-social-connection' }, '● OFFLINE');
const onlineText = el('span', {}, '0 online');
chatMeta.append(connectionText, onlineText);
chatPane.append(chatMeta);

const setupCard = el('form', { className: 'site-social-identity' });
setupCard.append(el('strong', {}, 'Pick a public display name'));
setupCard.append(el('p', {}, 'One name for Global Chat and Ask Hynoe. Do not use your real name if you want to stay private.'));
const nameInput = el('input', { type: 'text', maxlength: 24, minlength: 1, autocomplete: 'nickname', placeholder: 'Display name', required: true });
const turnstileHost = el('div', { className: 'site-social-turnstile' });
const joinButton = el('button', { type: 'submit', className: 'site-social-primary', disabled: true }, 'JOIN THE COMMUNITY');
const identityStatus = el('p', { className: 'site-social-status', role: 'status', 'aria-live': 'polite' }, 'Loading identity…');
setupCard.append(nameInput, turnstileHost, joinButton, identityStatus);
chatPane.append(setupCard);

const messages = el('div', { className: 'site-social-messages', role: 'log', 'aria-live': 'polite', 'aria-label': 'Hynoe Global Chat messages', hidden: true });
chatPane.append(messages);

const replyBar = el('div', { className: 'site-social-replybar', hidden: true });
const replyText = el('span');
const cancelReply = el('button', { type: 'button', 'aria-label': 'Cancel reply' }, '×');
replyBar.append(replyText, cancelReply);
chatPane.append(replyBar);

const composer = el('form', { className: 'site-social-composer', hidden: true });
const messageInput = el('textarea', { rows: 2, maxlength: 300, placeholder: 'Say something to the Hynoe community…', 'aria-label': 'Global Chat message' });
const composerFoot = el('div', { className: 'site-social-composer-foot' });
const countText = el('small', {}, '0 / 300');
const sendButton = el('button', { type: 'submit', className: 'site-social-primary' }, 'SEND');
composerFoot.append(countText, sendButton);
const composerStatus = el('p', { className: 'site-social-status', role: 'status', 'aria-live': 'polite' });
composer.append(messageInput, composerFoot, composerStatus);
chatPane.append(composer);

const askIntro = el('div', { className: 'site-social-ask-intro' });
const askIntroCopy = el('div');
askIntroCopy.append(el('strong', {}, 'Ask Hynoe anything about Hynoe SMP'));
askIntroCopy.append(el('p', {}, 'Private help grounded in official Hynoe information. Your questions are never posted to Global Chat.'));
const askClearButton = el('button', { type: 'button', className: 'site-social-ask-clear' }, 'CLEAR CONVERSATION');
askIntro.append(askIntroCopy, askClearButton);
askPane.append(askIntro);
const askTranscript = el('div', { className: 'site-social-ask-log', role: 'log', 'aria-live': 'polite' });
const askWelcome = el('article', { className: 'site-social-ask-message bot' });
askWelcome.append(el('strong', {}, 'HYNOE'));
askWelcome.append(el('p', {}, 'Ask me about joining, campaign progression, commands, economy, bosses, mods, village life, or site features. I will tell you when the official Hynoe sources do not verify an answer.'));
askTranscript.append(askWelcome);
askPane.append(askTranscript);
const askForm = el('form', { className: 'site-social-composer ask' });
const askInput = el('textarea', { rows: 2, maxlength: 600, placeholder: 'Ask Hynoe a server question…', 'aria-label': 'Ask Hynoe question', disabled: true });
const askFoot = el('div', { className: 'site-social-composer-foot' });
const askStatus = el('small', {}, 'JOIN THE COMMUNITY TO ASK');
const askButton = el('button', { type: 'submit', className: 'site-social-primary', disabled: true }, 'ASK');
askFoot.append(askStatus, askButton);
askForm.append(askInput, askFoot);
askPane.append(askForm);

const safety = el('footer', { className: 'site-social-safety' });
const rulesLink = el('a', { href: 'community-rules.html' }, 'Community rules');
const privacyLink = el('a', { href: 'privacy.html' }, 'Privacy');
safety.append(el('span', {}, 'Global Chat is public. Ask Hynoe is private from public chat.'), rulesLink, privacyLink);
panel.append(safety);

document.body.append(backdrop, launcher, panel);

function setHeadStatus(text) {
  brandText.querySelector('small').textContent = text;
}

function updateUnread() {
  unreadBadge.hidden = state.unread < 1;
  unreadBadge.textContent = state.unread > 99 ? '99+' : String(state.unread);
}

function setOpen(open, returnFocus = true) {
  state.open = Boolean(open);
  panel.hidden = !state.open;
  backdrop.hidden = !state.open;
  launcher.setAttribute('aria-expanded', String(state.open));
  document.documentElement.classList.toggle('site-social-open', state.open);
  if (state.open) {
    state.unread = 0;
    updateUnread();
    requestAnimationFrame(() => (panel.querySelector(FOCUSABLE) || panel).focus());
  } else if (returnFocus) {
    launcher.focus();
  }
}

function setTab(tab) {
  state.activeTab = tab === 'ask' ? 'ask' : 'chat';
  chatPane.hidden = state.activeTab !== 'chat';
  askPane.hidden = state.activeTab !== 'ask';
  chatTab.setAttribute('aria-selected', String(state.activeTab === 'chat'));
  askTab.setAttribute('aria-selected', String(state.activeTab === 'ask'));
  (state.activeTab === 'chat' ? chatTab : askTab).focus();
}

launcher.addEventListener('click', () => setOpen(!state.open, false));
backdrop.addEventListener('click', () => setOpen(false));
closeButton.addEventListener('click', () => setOpen(false));
chatTab.addEventListener('click', () => setTab('chat'));
askTab.addEventListener('click', () => setTab('ask'));

document.addEventListener('click', (event) => {
  const opener = event.target.closest?.('[data-open-site-social]');
  if (!opener) return;
  event.preventDefault();
  setOpen(true, false);
});

panel.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setOpen(false);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter((node) => !node.hidden && node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

messageInput.addEventListener('input', () => {
  countText.textContent = `${messageInput.value.length} / 300`;
});

cancelReply.addEventListener('click', () => {
  state.replyTo = null;
  renderReplyBar();
  messageInput.focus();
});

function renderReplyBar() {
  if (!state.replyTo) {
    replyBar.hidden = true;
    replyText.textContent = '';
    return;
  }
  replyBar.hidden = false;
  replyText.textContent = `Replying to ${state.replyTo.display_name || 'community member'}`;
}

function timeLabel(value) {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsed);
}

function reactionsFor(messageId) {
  const rows = state.reactions.filter((row) => row.message_id === messageId);
  const counts = new Map();
  for (const row of rows) counts.set(row.reaction, (counts.get(row.reaction) || 0) + 1);
  return { rows, counts };
}

function renderMessages() {
  const nearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 90;
  const byId = new Map(state.messages.map((item) => [item.id, item]));
  const nodes = [];
  for (const message of state.messages) {
    const article = el('article', { className: `site-social-message${message.author_id === state.session?.user?.id ? ' mine' : ''}` });
    const head = el('div', { className: 'site-social-message-head' });
    const name = el('strong', {}, message.display_name || 'Guest');
    if (message.staff_role) name.append(el('span', { className: 'site-social-staff' }, ` ${message.staff_role.toUpperCase()}`));
    head.append(name, el('time', { dateTime: message.created_at || '' }, timeLabel(message.created_at)));
    article.append(head);

    if (message.reply_to) {
      const target = byId.get(message.reply_to);
      const reply = el('div', { className: 'site-social-reply-context' });
      reply.append(el('small', {}, `↳ ${target?.display_name || 'Earlier message'}`));
      if (target && !target.is_deleted) reply.append(el('span', {}, String(target.body || '').slice(0, 80)));
      article.append(reply);
    }

    article.append(el('p', { className: 'site-social-message-body' }, messageDisplayBody(message)));
    if (!message.is_deleted) {
      const actions = el('div', { className: 'site-social-message-actions' });
      const reactionState = reactionsFor(message.id);
      for (const reaction of SITE_REACTIONS) {
        const mine = reactionState.rows.some((row) => row.user_id === state.session?.user?.id && row.reaction === reaction);
        const count = reactionState.counts.get(reaction) || 0;
        const button = el('button', { type: 'button', className: mine ? 'active' : '', 'aria-label': `${reaction} reaction` }, `${reactionIcons[reaction]}${count ? ` ${count}` : ''}`);
        button.addEventListener('click', async () => {
          if (!state.client || !state.session) return;
          button.disabled = true;
          try {
            await setMessageReaction(state.client, { messageId: message.id, userId: state.session.user.id, reaction, active: !mine });
            await refreshReactions();
          } catch (error) {
            composerStatus.textContent = error.message;
          } finally {
            button.disabled = false;
          }
        });
        actions.append(button);
      }
      const replyButton = el('button', { type: 'button' }, 'Reply');
      replyButton.addEventListener('click', () => {
        state.replyTo = message;
        renderReplyBar();
        messageInput.focus();
      });
      const reportButton = el('button', { type: 'button' }, 'Report');
      reportButton.addEventListener('click', async () => {
        if (!state.client || !state.session) return;
        if (!window.confirm('Report this message to Hynoe moderators?')) return;
        reportButton.disabled = true;
        try {
          await reportSiteMessage(state.client, { messageId: message.id, userId: state.session.user.id, reason: 'other', details: 'Reported from the Global Chat panel.' });
          reportButton.textContent = 'Reported';
        } catch (error) {
          composerStatus.textContent = error.message;
        } finally {
          reportButton.disabled = false;
        }
      });
      actions.append(replyButton, reportButton);
      article.append(actions);
    }
    nodes.push(article);
  }
  if (!nodes.length) nodes.push(el('p', { className: 'site-social-empty' }, 'No messages yet. Start the Hynoe conversation.'));
  messages.replaceChildren(...nodes);
  if (nearBottom) messages.scrollTop = messages.scrollHeight;
}

function renderAnnouncement() {
  if (!state.announcement) {
    announcementBox.hidden = true;
    return;
  }
  announcementBox.hidden = false;
  announcementText.textContent = state.announcement.body;
  if (state.announcement.link_url) {
    announcementLink.hidden = false;
    announcementLink.href = state.announcement.link_url;
    announcementLink.textContent = 'OPEN →';
  } else {
    announcementLink.hidden = true;
    announcementLink.removeAttribute('href');
  }
}

function renderPresence(presenceState) {
  state.online = presenceOnlineCount(presenceState);
  onlineText.textContent = `${state.online} online`;
}

async function refreshReactions() {
  if (!state.client) return;
  state.reactions = await loadMessageReactions(state.client, state.messages.map((message) => message.id));
  renderMessages();
}

async function refreshChat({ countUnread = false } = {}) {
  if (!state.client || state.refreshBusy) return;
  state.refreshBusy = true;
  const before = new Set(state.messages.map((item) => item.id));
  try {
    const [history, announcement] = await Promise.all([
      loadRecentMessages(state.client, 75),
      loadActiveAnnouncement(state.client),
    ]);
    state.messages = mergeMessageLists([], history, 100);
    state.announcement = announcement;
    state.reactions = await loadMessageReactions(state.client, state.messages.map((message) => message.id));
    const added = state.messages.filter((item) => !before.has(item.id)).length;
    if (countUnread && !state.open && added) {
      state.unread += added;
      updateUnread();
    }
    renderAnnouncement();
    renderMessages();
  } catch (error) {
    composerStatus.textContent = error.message;
  } finally {
    state.refreshBusy = false;
  }
}

async function connectCommunity() {
  if (!state.client || !state.session || !state.profile) return;
  setupCard.hidden = true;
  messages.hidden = false;
  composer.hidden = false;
  askInput.disabled = false;
  askButton.disabled = false;
  askStatus.textContent = 'PRIVATE HELP READY';
  connectionText.textContent = '● LIVE';
  connectionText.classList.add('live');
  setHeadStatus(`Signed in as ${state.profile.display_name}`);
  await refreshChat();
  if (state.channelHandle) await state.channelHandle.close();
  state.channelHandle = await connectGlobalChannel(state.client, {
    userId: state.session.user.id,
    displayName: state.profile.display_name,
    page: location.pathname,
    onPresence: renderPresence,
    onBroadcast: async () => refreshChat({ countUnread: true }),
    refreshHistory: async () => refreshChat(),
    onStatus: (status) => {
      connectionText.textContent = status === 'SUBSCRIBED' ? '● LIVE' : `● ${String(status || 'CONNECTING').replaceAll('_', ' ')}`;
      connectionText.classList.toggle('live', status === 'SUBSCRIBED');
    },
  });
}

async function joinWithName(displayName) {
  const checked = validateDisplayName(displayName);
  if (!checked.ok) throw new Error(checked.error);
  state.session = await ensureSiteSession(state.client, state.captchaToken);
  state.profile = await ensureProfile(state.client, state.session.user, checked.value);
  try { localStorage.setItem(DISPLAY_NAME_KEY, checked.value); } catch {}
  await connectCommunity();
}

function setJoinReady() {
  joinButton.disabled = !state.client;
}

function renderTurnstile() {
  if (!state.config?.enabled || state.session || !state.config.turnstileSiteKey) {
    setJoinReady();
    return;
  }
  const mount = () => {
    if (!window.turnstile || state.turnstileWidget != null) return;
    state.turnstileWidget = window.turnstile.render(turnstileHost, {
      sitekey: state.config.turnstileSiteKey,
      theme: 'dark',
      callback: (token) => {
        state.captchaToken = token;
        identityStatus.textContent = 'Verified. Pick your name and join.';
        setJoinReady();
      },
      'expired-callback': () => {
        state.captchaToken = '';
        identityStatus.textContent = 'Verification expired. Complete it again.';
        setJoinReady();
      },
      'error-callback': () => {
        state.captchaToken = '';
        identityStatus.textContent = 'Verification could not load. Try again.';
        setJoinReady();
      },
    });
  };
  if (window.turnstile) {
    mount();
    return;
  }
  let script = document.getElementById('hynoe-turnstile-script');
  if (!script) {
    script = document.createElement('script');
    script.id = 'hynoe-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.append(script);
  }
  script.addEventListener('load', mount, { once: true });
}

setupCard.addEventListener('submit', async (event) => {
  event.preventDefault();
  joinButton.disabled = true;
  identityStatus.textContent = 'Joining…';
  try {
    await joinWithName(nameInput.value);
  } catch (error) {
    identityStatus.textContent = error.message;
    if (!state.session) renderTurnstile();
  } finally {
    setJoinReady();
  }
});

composer.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.client || !state.session || !messageInput.value.trim()) return;
  sendButton.disabled = true;
  composerStatus.textContent = 'Sending…';
  try {
    await sendSiteMessage(state.client, { body: messageInput.value, replyTo: state.replyTo?.id || null });
    messageInput.value = '';
    countText.textContent = '0 / 300';
    state.replyTo = null;
    renderReplyBar();
    composerStatus.textContent = '';
    await refreshChat();
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    composerStatus.textContent = error.message;
  } finally {
    sendButton.disabled = false;
  }
});

function renderAskTurn(role, content, result = null) {
  const article = el('article', { className: `site-social-ask-message ${role === 'user' ? 'user' : 'bot'}` });
  article.append(el('strong', {}, role === 'user' ? (state.profile?.display_name || 'YOU') : 'HYNOE'));
  article.append(el('p', {}, content));
  if (result) {
    const confidence = el('small', { className: `site-social-help-confidence${result.confidence < 0.5 ? ' uncertain' : ''}` }, result.confidence < 0.5 ? 'COULD NOT FULLY VERIFY' : 'GROUNDED IN HYNOE SOURCES');
    article.append(confidence);
    if (result.sources.length) {
      const sourceBox = el('div', { className: 'site-social-help-sources' });
      sourceBox.append(el('span', {}, 'Sources'));
      for (const source of result.sources) sourceBox.append(el('a', { href: source.url }, source.label));
      article.append(sourceBox);
    }
    if (result.requestId) {
      const feedback = el('div', { className: 'site-social-ask-feedback' });
      feedback.append(el('small', {}, 'Was this helpful?'));
      const helpfulButton = el('button', { type: 'button', 'aria-label': 'Helpful' }, '👍 Helpful');
      const unhelpfulButton = el('button', { type: 'button', 'aria-label': 'Not helpful' }, '👎 Not helpful');
      const saveFeedback = async (helpful) => {
        helpfulButton.disabled = true;
        unhelpfulButton.disabled = true;
        try {
          await sendHelpFeedback(state.client, { requestId: result.requestId, helpful });
          feedback.replaceChildren(el('small', {}, 'Thanks — feedback saved.'));
        } catch (error) {
          helpfulButton.disabled = false;
          unhelpfulButton.disabled = false;
          askStatus.textContent = error.message || 'Feedback could not be saved.';
        }
      };
      helpfulButton.addEventListener('click', () => saveFeedback(true));
      unhelpfulButton.addEventListener('click', () => saveFeedback(false));
      feedback.append(helpfulButton, unhelpfulButton);
      article.append(feedback);
    }
  }
  return article;
}

function renderStoredAskHistory() {
  if (!state.askHistory.length) {
    askTranscript.replaceChildren(askWelcome);
    return;
  }
  askTranscript.replaceChildren(...state.askHistory.map((turn) => renderAskTurn(turn.role, turn.content)));
  askTranscript.scrollTop = askTranscript.scrollHeight;
}

askClearButton.addEventListener('click', () => {
  state.askHistory = [];
  renderStoredAskHistory();
  askStatus.textContent = 'PRIVATE HISTORY CLEARED';
  askInput.focus();
});

renderStoredAskHistory();

askForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.askBusy) return;
  const question = askInput.value.trim();
  if (!question) return;
  if (!state.client || !state.session || !state.profile) {
    askStatus.textContent = 'JOIN THE COMMUNITY TO ASK';
    return;
  }
  const previousHistory = state.askHistory;
  askTranscript.append(renderAskTurn('user', question));
  askTranscript.scrollTop = askTranscript.scrollHeight;
  state.askBusy = true;
  askButton.disabled = true;
  askInput.disabled = true;
  askStatus.textContent = 'ASKING HYNOE…';
  try {
    const result = await askHynoe(state.client, { question, history: previousHistory, pagePath: location.pathname });
    askTranscript.append(renderAskTurn('assistant', result.answer, result));
    state.askHistory = appendPrivateHistory(previousHistory, { role: 'user', content: question.slice(0, 500) });
    state.askHistory = appendPrivateHistory(state.askHistory, { role: 'assistant', content: result.answer.slice(0, 500) });
    askInput.value = '';
    askStatus.textContent = result.confidence < 0.5 ? 'ANSWER NEEDS MORE OFFICIAL INFO' : 'PRIVATE HELP READY';
  } catch (error) {
    askTranscript.append(renderAskTurn('assistant', error.message || 'I could not answer that right now.'));
    askStatus.textContent = 'TRY AGAIN';
  } finally {
    state.askBusy = false;
    askButton.disabled = false;
    askInput.disabled = false;
    askTranscript.scrollTop = askTranscript.scrollHeight;
    askInput.focus();
  }
});

async function initialize() {
  try {
    state.config = await loadSiteSocialConfig();
    if (!state.config.enabled) {
      setHeadStatus('Community backend not connected yet');
      connectionText.textContent = '● SETUP PENDING';
      identityStatus.textContent = 'The panel is installed site-wide. The dedicated community backend still needs its production connection.';
      nameInput.disabled = true;
      joinButton.disabled = true;
      askInput.disabled = true;
      askButton.disabled = true;
      askStatus.textContent = 'BACKEND SETUP PENDING';
      return;
    }
    state.client = createSiteSocialClient(state.config);
    const { data, error } = await state.client.auth.getSession();
    if (error) throw error;
    state.session = data?.session || null;
    let storedName = '';
    try { storedName = localStorage.getItem(DISPLAY_NAME_KEY) || ''; } catch {}
    nameInput.value = storedName;
    if (state.session && storedName) {
      state.profile = await ensureProfile(state.client, state.session.user, storedName);
      await connectCommunity();
      return;
    }
    identityStatus.textContent = state.session ? 'Choose your public display name.' : 'Choose a name and complete verification once.';
    setJoinReady();
    renderTurnstile();
  } catch (error) {
    setHeadStatus('Community connection unavailable');
    connectionText.textContent = '● OFFLINE';
    identityStatus.textContent = error.message || 'Community tools could not start.';
  }
}

window.addEventListener('pagehide', () => {
  state.channelHandle?.close?.();
});

initialize();
