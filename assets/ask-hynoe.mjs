const QUESTION_MAX = 600;
const HISTORY_MAX = 6;
const HISTORY_CONTENT_MAX = 500;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value, max = Infinity) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safePath(value) {
  const path = clean(value, 240);
  return /^\/[A-Za-z0-9_./-]*$/.test(path) ? path : '/';
}

export function validateBrowserQuestion(value) {
  const raw = String(value ?? '');
  const question = clean(raw);
  if (!question || question.length > QUESTION_MAX || CONTROL_RE.test(raw)) {
    return { ok: false, error: 'Ask a question using 1–600 readable characters.' };
  }
  return { ok: true, value: question };
}

export function appendPrivateHistory(history = [], turn) {
  if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) throw new Error('Invalid private history role.');
  const content = clean(turn.content, HISTORY_CONTENT_MAX + 1);
  if (!content || content.length > HISTORY_CONTENT_MAX || CONTROL_RE.test(String(turn.content ?? ''))) throw new Error('Invalid private history content.');
  return [...(Array.isArray(history) ? history : []), { role: turn.role, content }].slice(-HISTORY_MAX);
}

export function normalizeHelpResult(data = {}) {
  const answer = clean(data.answer, 4000);
  if (!answer) throw new Error('Ask Hynoe returned an empty answer.');
  const seen = new Set();
  const sources = [];
  for (const source of Array.isArray(data.sources) ? data.sources : []) {
    const url = String(source?.url ?? '');
    if (!/^\/[A-Za-z0-9_./-]*$/.test(url) || seen.has(url)) continue;
    seen.add(url);
    sources.push({ label: clean(source?.label || 'Hynoe source', 120), url });
    if (sources.length >= 4) break;
  }
  const confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0));
  const mode = data.mode === 'model' ? 'model' : 'retrieval';
  return { answer, sources, confidence, mode, requestId: clean(data.request_id, 100) };
}

function normalizeHistory(history = []) {
  let bounded = [];
  for (const turn of Array.isArray(history) ? history.slice(-HISTORY_MAX) : []) bounded = appendPrivateHistory(bounded, turn);
  return bounded;
}

export async function askHynoe(client, { question, history = [], pagePath = '/', timeoutMs = 12000 } = {}) {
  if (!client?.functions?.invoke) throw new Error('Ask Hynoe is unavailable right now.');
  const checked = validateBrowserQuestion(question);
  if (!checked.ok) throw new Error(checked.error);
  const boundedHistory = normalizeHistory(history);
  const body = { question: checked.value, history: boundedHistory, page_path: safePath(pagePath) };

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Ask Hynoe is taking too long. Try again.')), Math.max(10, Math.min(30000, Number(timeoutMs) || 12000)));
  });
  try {
    const invocation = client.functions.invoke('ask-hynoe', { body });
    const { data, error } = await Promise.race([invocation, timeout]);
    if (error || !data) throw new Error('Ask Hynoe could not answer that right now.');
    return normalizeHelpResult(data);
  } finally {
    clearTimeout(timer);
  }
}
