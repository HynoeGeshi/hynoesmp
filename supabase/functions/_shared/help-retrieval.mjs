const STOP_WORDS = new Set([
  'the','and','for','that','with','this','from','your','you','are','but','not','into','has','have','was','will','can','our','all','use','its','how','what','when','where','who','why','a','an','to','of','in','on','at','as','or','is','be','by','it','do','does','i','me','my','about','learn','work','players','current','see'
]);

const INJECTION_PATTERNS = [
  /^\s*(system|assistant|developer|user)\s*:/i,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /reveal\s+(the\s+)?(secret|secrets|password|passwords|token|tokens|api key|service role)/i,
  /do\s+not\s+follow\s+(the\s+)?(rules|instructions)/i,
  /act\s+as\s+(an?\s+)?(administrator|admin|system)/i,
];

function normalize(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function tokenize(value) {
  const raw = normalize(value).toLowerCase().match(/\/[a-z0-9_-]+|[a-z0-9][a-z0-9'-]{1,}/g) ?? [];
  return [...new Set(raw.filter((token) => !STOP_WORDS.has(token)))];
}

function stripInstructionLikeText(value) {
  const pieces = String(value ?? '').split(/(?<=[.!?])\s+|\n+/);
  const kept = pieces.filter((piece) => {
    const text = normalize(piece);
    return text && !INJECTION_PATTERNS.some((pattern) => pattern.test(text));
  });
  return normalize(kept.join(' '));
}

function safeHeading(value) {
  const text = stripInstructionLikeText(value);
  if (!text || INJECTION_PATTERNS.some((pattern) => pattern.test(text))) return 'Official Hynoe information';
  return text.slice(0, 180);
}

export function sanitizeKnowledgeChunk(chunk = {}) {
  return {
    id: normalize(chunk.id).slice(0, 128),
    page: normalize(chunk.page).slice(0, 180),
    url: /^\/[A-Za-z0-9_./-]*$/.test(String(chunk.url ?? '')) ? String(chunk.url) : '/',
    title: stripInstructionLikeText(chunk.title).slice(0, 220),
    heading: safeHeading(chunk.heading),
    text: stripInstructionLikeText(chunk.text).slice(0, 1800),
    dated_at: /^\d{4}-\d{2}-\d{2}/.test(String(chunk.dated_at ?? '')) ? String(chunk.dated_at).slice(0, 10) : null,
    status: ['confirmed','announced','planned','unknown'].includes(String(chunk.status)) ? String(chunk.status) : 'confirmed',
    tokens: Array.isArray(chunk.tokens) ? chunk.tokens.map(normalize).filter(Boolean).slice(0, 220) : [],
  };
}


const PRIVATE_QUERY_PATTERNS = [
  /\bsecret\b/i,
  /\bpassword\b/i,
  /\bcredential(?:s)?\b/i,
  /\bapi\s*key\b/i,
  /\bprivate\s*key\b/i,
  /\bservice\s*role\b/i,
  /\badmin\s+(?:code|password|token|secret)\b/i,
  /\bvault\s+code\b/i,
];

const INTENT_PAGE_HINTS = [
  { pattern: /\b(?:campaign|progression|quests?|genesis\s+ages?)\b/i, url: '/progression.html', boost: 6 },
  { pattern: /\b(?:updates?|changelog|release\s+notes?|what\s+changed|latest\s+changes?)\b/i, url: '/updates.html', boost: 6 },
  { pattern: /\b(?:economy|jobs?|dollars?|tokens?|vault)\b/i, url: '/economy.html', boost: 6 },
  { pattern: /\b(?:commands?|help\s+command|help)\b/i, url: '/start.html', boost: 6 },
  { pattern: /\bboss(?:es)?\b/i, url: '/bosses.html', boost: 7 },
];

function isPrivateInfoQuery(question) {
  return PRIVATE_QUERY_PATTERNS.some((pattern) => pattern.test(String(question ?? '')));
}

function intentPageBoost(question, url) {
  let boost = 0;
  for (const hint of INTENT_PAGE_HINTS) {
    if (hint.url === url && hint.pattern.test(String(question ?? ''))) boost = Math.max(boost, hint.boost);
  }
  return boost;
}

function commandTokens(value) {
  return String(value ?? '').match(/\/[a-z0-9_-]+/gi)?.map((token) => token.toLowerCase()) ?? [];
}

function dateBoost(datedAt) {
  if (!datedAt) return 0;
  const ts = Date.parse(datedAt);
  if (!Number.isFinite(ts)) return 0;
  const baseline = Date.parse('2025-01-01T00:00:00Z');
  const days = Math.max(0, Math.min(900, (ts - baseline) / 86_400_000));
  return Math.min(1.5, days / 600);
}

function exactPhraseBoost(question, haystack) {
  const q = normalize(question).toLowerCase();
  if (q.length < 5) return 0;
  const phrases = q.split(/[?.!,;]/).map(normalize).filter((x) => x.length >= 8);
  return phrases.some((phrase) => haystack.includes(phrase)) ? 6 : 0;
}

export function rankHelpChunks(question, chunks = [], options = {}) {
  const limit = Math.max(1, Math.min(12, Number(options.limit) || 5));
  const q = normalize(question);
  const qTokens = tokenize(q);
  const qCommands = commandTokens(q);
  if (!q || !qTokens.length) return [];

  const results = [];
  for (const raw of chunks ?? []) {
    const chunk = sanitizeKnowledgeChunk(raw);
    if (!chunk.text && !chunk.heading && !chunk.title) continue;
    const title = `${chunk.title} ${chunk.heading}`.toLowerCase();
    const body = `${chunk.text} ${chunk.tokens.join(' ')}`.toLowerCase();
    const all = `${title} ${body}`;
    const chunkTokens = new Set(tokenize(all));
    let score = 0;
    let matches = 0;

    for (const token of qTokens) {
      if (!chunkTokens.has(token)) continue;
      matches += 1;
      score += 2;
      if (title.includes(token)) score += 2.5;
      if (body.includes(token)) score += 0.5;
    }

    for (const command of qCommands) {
      if (all.includes(command)) score += 10;
    }

    score += exactPhraseBoost(q, all);
    score += intentPageBoost(q, chunk.url);
    score += dateBoost(chunk.dated_at);
    if (chunk.status === 'confirmed') score += 0.4;
    if (matches >= Math.min(3, qTokens.length)) score += 3;

    if (score > 0) results.push({
      score: Number(score.toFixed(3)),
      matches,
      queryTokenCount: qTokens.length,
      coverage: qTokens.length ? Number((matches / qTokens.length).toFixed(3)) : 0,
      privateQuery: isPrivateInfoQuery(q),
      chunk,
    });
  }

  return results
    .sort((a, b) => b.score - a.score || String(b.chunk.dated_at ?? '').localeCompare(String(a.chunk.dated_at ?? '')) || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, limit);
}

function numericClaims(text) {
  const out = new Map();
  const normalized = normalize(text).toLowerCase();
  for (const match of normalized.matchAll(/\b(\d+)\s+([a-z][a-z'-]{2,})\b/g)) {
    const [, value, noun] = match;
    if (!out.has(noun)) out.set(noun, new Set());
    out.get(noun).add(value);
  }
  return out;
}

function likelyConflict(a, b) {
  if (!a?.chunk || !b?.chunk) return false;
  const aHeading = normalize(a.chunk.heading || a.chunk.title).toLowerCase();
  const bHeading = normalize(b.chunk.heading || b.chunk.title).toLowerCase();
  if ((aHeading || bHeading) && aHeading !== bHeading) return false;

  const ca = numericClaims(a.chunk.text);
  const cb = numericClaims(b.chunk.text);
  for (const [noun, valuesA] of ca) {
    const valuesB = cb.get(noun);
    if (!valuesB) continue;
    if ([...valuesA].some((value) => !valuesB.has(value)) && [...valuesB].some((value) => !valuesA.has(value))) return true;
  }

  const ta = normalize(a.chunk.text).toLowerCase();
  const tb = normalize(b.chunk.text).toLowerCase();
  const opposites = [['enabled','disabled'],['required','optional'],['yes','no'],['true','false']];
  return opposites.some(([left,right]) => (ta.includes(left) && tb.includes(right)) || (ta.includes(right) && tb.includes(left)));
}

export function classifyRetrieval(results = []) {
  const usable = (results ?? []).filter((item) => item?.chunk && Number.isFinite(item.score));
  if (!usable.length) return { confidence: 'low', conflict: false, topScore: 0 };
  const conflict = usable.slice(0, 4).some((item, index, list) => list.slice(index + 1).some((other) => likelyConflict(item, other)));
  const topScore = usable[0].score;
  const topCoverage = Number.isFinite(usable[0].coverage) ? usable[0].coverage : 1;
  const privateQuery = usable.some((item) => item.privateQuery === true);
  const confidence = (conflict || privateQuery || topCoverage < 0.4)
    ? 'low'
    : (topScore >= 12 && topCoverage >= 0.5)
      ? 'high'
      : topScore >= 5
        ? 'medium'
        : 'low';
  return { confidence, conflict, topScore, topCoverage, privateQuery };
}

function sourceList(results) {
  const seen = new Set();
  const sources = [];
  for (const result of results ?? []) {
    const chunk = result?.chunk;
    if (!chunk?.url || seen.has(chunk.url)) continue;
    seen.add(chunk.url);
    sources.push({
      title: chunk.heading || chunk.title || 'Hynoe guide',
      url: chunk.url,
      page: chunk.page,
    });
    if (sources.length >= 4) break;
  }
  return sources;
}

export function buildFallbackAnswer(question, results = []) {
  const classification = classifyRetrieval(results);
  const sources = sourceList(results);
  if (classification.confidence === 'low' || classification.conflict || !results.length) {
    return {
      answer: classification.conflict
        ? 'I found conflicting official Hynoe information, so I cannot verify a single answer yet. Check the linked official pages for the newest confirmed details.'
        : 'I couldn’t verify that from the current official Hynoe information, so I don’t want to guess.',
      sources: classification.conflict ? sources : [],
      confidence: 'low',
      conflict: classification.conflict,
    };
  }

  const excerpts = [];
  for (const result of results.slice(0, 3)) {
    const text = normalize(result.chunk.text);
    if (!text) continue;
    excerpts.push(text.length > 360 ? `${text.slice(0, 357).trim()}…` : text);
  }
  return {
    answer: excerpts.join('\n\n') || 'I found relevant official Hynoe information, but there was not enough readable text to answer safely.',
    sources,
    confidence: classification.confidence,
    conflict: false,
  };
}
