export const ASK_HYNOE_LIMITS = Object.freeze({
  questionMax: 600,
  historyTurnsMax: 6,
  historyContentMax: 500,
  windowMs: 5 * 60 * 1000,
  maxRequestsPerWindow: 12,
});

const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function safePagePath(value) {
  const path = clean(value).slice(0, 240);
  return /^\/[A-Za-z0-9_./-]*$/.test(path) ? path : '/';
}

export function validateAskPayload(payload = {}) {
  const rawQuestion = String(payload?.question ?? '');
  const question = clean(rawQuestion);
  if (!question || question.length > ASK_HYNOE_LIMITS.questionMax || CONTROL_RE.test(rawQuestion)) {
    return { ok: false, status: 400, code: 'invalid_question', error: 'Question must be 1–600 readable characters.' };
  }

  const rawHistory = payload?.history ?? [];
  if (!Array.isArray(rawHistory) || rawHistory.length > ASK_HYNOE_LIMITS.historyTurnsMax) {
    return { ok: false, status: 400, code: 'invalid_history', error: 'Conversation history is too long.' };
  }
  const history = [];
  for (const turn of rawHistory) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) {
      return { ok: false, status: 400, code: 'invalid_history', error: 'Conversation history contains an invalid role.' };
    }
    const rawContent = String(turn.content ?? '');
    const content = clean(rawContent);
    if (!content || content.length > ASK_HYNOE_LIMITS.historyContentMax || CONTROL_RE.test(rawContent)) {
      return { ok: false, status: 400, code: 'invalid_history', error: 'Conversation history contains invalid content.' };
    }
    history.push({ role: turn.role, content });
  }

  return { ok: true, value: { question, history, pagePath: safePagePath(payload?.page_path) } };
}

export function confidenceNumber(value) {
  if (value === 'high') return 0.9;
  if (value === 'medium') return 0.65;
  return 0.25;
}

export function shouldUseProvider({ providerConfigured, classification } = {}) {
  return Boolean(providerConfigured && classification && !classification.conflict && (classification.confidence === 'high' || classification.confidence === 'medium'));
}

export function buildFeedbackRow({ userId, requestId, question, answer, sources = [], mode, confidence, pagePath, unanswered } = {}) {
  return {
    user_id: String(userId ?? ''),
    request_id: String(requestId ?? ''),
    question: clean(question).slice(0, ASK_HYNOE_LIMITS.questionMax),
    answer_summary: clean(answer).slice(0, 1200) || null,
    helpful: null,
    unanswered: Boolean(unanswered),
    source_ids: [...new Set((sources ?? []).map((source) => String(source?.id ?? '')).filter(Boolean))].slice(0, 12),
    mode: mode === 'model' ? 'provider' : mode === 'provider' ? 'provider' : mode === 'fallback' ? 'fallback' : 'retrieval',
    confidence: ['high','medium','low'].includes(confidence) ? confidence : 'low',
    page_path: safePagePath(pagePath),
  };
}
