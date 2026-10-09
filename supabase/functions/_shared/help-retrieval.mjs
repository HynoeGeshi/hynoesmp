const STOP_WORDS = new Set([
  'the','and','for','that','with','this','from','your','you','are','but','not','into','has','have','was','will','can','our','all','use','its','how','what','when','where','who','why','a','an','to','of','in','on','at','as','or','is','be','by','it','do','does','i','me','my','about','learn','work','players','current','see','up','many'
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
  return [...new Set(raw.filter((token) => !STOP_WORDS.has(token)).map((token) =>
    !token.startsWith('/') && token.length > 3 && token.endsWith('s') && !token.endsWith('ss')
      ? token.slice(0, token.endsWith('sses') ? -2 : -1)
      : token
  ))];
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

// Natural-language intent hints make common player questions land on the right
// official guide even when the player does not know Hynoe's exact command/name.
const INTENT_PAGE_HINTS = [
  { pattern: /\b(?:campaign|progression|quests?|genesis\s+ages?|gear|armor|weapon|enderium|vulpus)\b/i, url: '/progression.html', boost: 6 },
  { pattern: /\b(?:updates?|changelog|release\s+notes?|what\s+changed|latest\s+changes?)\b/i, url: '/updates.html', boost: 6 },
  { pattern: /\b(?:economy|jobs?|dollars?|tokens?|vault|shop|selling|balance)\b/i, url: '/economy.html', boost: 6 },
  { pattern: /\b(?:commands?|help\s+command|help)\b/i, url: '/start.html', boost: 6 },
  { pattern: /\b(?:teleport(?:ing)?|travel|visit|\/tpa|tpa|tpaccept|tpdeny|\/rtp|rtp|random\s+teleport|homes?|waystones?)\b/i, url: '/start.html', boost: 8 },
  { pattern: /\b(?:join|connect|server\s+(?:address|ip)|address|ip\s+address)\b/i, url: '/join.html', boost: 7 },
  { pattern: /\b(?:install|download|modpack|client\s+pack|fabric|launcher)\b/i, url: '/modpack.html', boost: 7 },
  { pattern: /\b(?:village|villager|mca|minecraft\s+comes\s+alive|marry|marriage|family|children|child|relationship)\b/i, url: '/mca.html', boost: 7 },
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
    const textTokens = new Set(tokenize(chunk.text));
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

    // Page routing and recency can order evidence, but cannot create a match.
    if (matches > 0 && score > 0 && focusedExcerpt(q, chunk)) results.push({
      score: Number(score.toFixed(3)),
      matches,
      bodyMatches: qTokens.filter((token) => textTokens.has(token)).length,
      queryTokenCount: qTokens.length,
      coverage: qTokens.length ? Number((matches / qTokens.length).toFixed(3)) : 0,
      privateQuery: isPrivateInfoQuery(q),
      chunk,
    });
  }

  return results
    .sort((a, b) => b.score - a.score || b.bodyMatches - a.bodyMatches || String(b.chunk.dated_at ?? '').localeCompare(String(a.chunk.dated_at ?? '')) || a.chunk.id.localeCompare(b.chunk.id))
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

  // Coverage alone should not veto a strong, clearly routed official match. Normal
  // questions contain conversational words that never appear verbatim in a guide.
  // Secrets and conflicts still always fail closed.
  const confidence = (conflict || privateQuery)
    ? 'low'
    : (topScore >= 12 && topCoverage >= 0.4)
      ? 'high'
      : (topScore >= 5 && (topCoverage >= 0.2 || topScore >= 8))
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

const PROFILE_FIELDS = [
  'Name','Canonical Url','Server Address','Edition','Loader','Client Requirement','Join Url','Modpack Url','Discovery Url','Discord Url','Category Tags','Features','Positioning','Last Reviewed',
];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function profileField(text, label) {
  const labels = PROFILE_FIELDS.map(escapeRegex).join('|');
  const pattern = new RegExp(`(?:^|\\.\\s+)${escapeRegex(label)}:\\s*(.*?)(?=\\.\\s+(?:${labels}):|$)`, 'i');
  const match = normalize(text).match(pattern);
  return normalize(match?.[1] ?? '').replace(/\.+$/g, '').trim();
}

function humanList(values = []) {
  const items = values.map(normalize).filter(Boolean);
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function naturalServerOverview(question, results = []) {
  const q = normalize(question);
  const overviewIntent = /\b(?:what(?:'s| is)?\s+(?:this|the|hynoe(?:\s+smp)?)\s+server\s+(?:about|like)|tell\s+me\s+about\s+(?:this|the|hynoe(?:\s+smp)?)\s+server|what\s+is\s+hynoe(?:\s+smp)?|server\s+overview)\b/i.test(q);
  if (!overviewIntent) return '';

  const profile = results.find((result) => result?.chunk?.url === '/data/server-profile.json' || /canonical server profile/i.test(String(result?.chunk?.heading ?? '')))?.chunk;
  if (!profile?.text) return '';

  const name = profileField(profile.text, 'Name') || 'Hynoe SMP';
  const edition = profileField(profile.text, 'Edition');
  const loader = profileField(profile.text, 'Loader');
  const tags = profileField(profile.text, 'Category Tags').split(';').map(normalize).filter((item) => item && !/^smp$/i.test(item));
  const features = profileField(profile.text, 'Features').split(';').map(normalize).filter(Boolean);
  const positioning = profileField(profile.text, 'Positioning');
  const clientRequirement = profileField(profile.text, 'Client Requirement');

  const sentences = [];
  const platform = [edition, loader].filter(Boolean).join(' ');
  const focus = humanList(tags.slice(0, 4));
  sentences.push(`${name} is a ${platform ? `${platform} ` : ''}server${focus ? ` focused on ${focus}` : ''}.`);

  if (features.length) {
    sentences.push(`Core systems include ${humanList(features.slice(0, 5))}.`);
  }

  const positionMatch = positioning.match(/^long-term modded survival built for\s+(.+)$/i);
  if (positionMatch?.[1]) {
    sentences.push(`It is designed as long-term modded survival for ${positionMatch[1]}.`);
  } else if (positioning) {
    sentences.push(`${positioning.replace(/^[a-z]/, (letter) => letter.toUpperCase())}.`);
  }

  if (clientRequirement) {
    const requirement = clientRequirement.replace(/\s+required$/i, ' is required');
    sentences.push(`To join, ${/^the\b/i.test(requirement) ? requirement : `the ${requirement}`}.`);
  }

  return sentences.join(' ');
}

function focusedExcerpt(question, chunk) {
  const query = tokenize(question);
  const matches = (text) => {
    const tokens = new Set(tokenize(text));
    return query.filter((token) => tokens.has(token)).length;
  };
  const sentences = normalize(chunk.text).split(/(?<=[.!?])\s+(?=[A-Z0-9/])/);
  const start = sentences.findIndex((sentence) => /[a-z]/.test(sentence) && matches(sentence) > 0);
  // A narrow heading can supply the subject of a useful follow-up paragraph
  // (for example, Homes followed by the names of unlock milestones).
  if (start < 0) {
    if (matches(chunk.heading) < Math.ceil(query.length / 2)) return '';
    const text = normalize(chunk.text);
    return text.length > 360 ? `${text.slice(0, 357).trim()}…` : text;
  }
  const excerpt = [];
  for (const sentence of sentences.slice(start)) {
    if (!/[a-z]/.test(sentence) || !matches(sentence)) break;
    const next = [...excerpt, sentence].join(' ');
    if (next.length > 360) {
      if (!excerpt.length) return `${sentence.slice(0, 357).trim()}…`;
      break;
    }
    excerpt.push(sentence);
  }
  return excerpt.join(' ');
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

  const overview = naturalServerOverview(question, results);
  if (overview) {
    return {
      answer: overview,
      sources,
      confidence: classification.confidence,
      conflict: false,
    };
  }

  const excerpts = [];
  const evidence = [];
  for (const result of results) {
    const text = focusedExcerpt(question, result.chunk);
    if (!text) continue;
    excerpts.push(text);
    evidence.push(result);
    if (excerpts.length >= 3) break;
  }
  return {
    answer: excerpts.join('\n\n') || 'I found relevant official Hynoe information, but there was not enough readable text to answer safely.',
    sources: sourceList(evidence),
    confidence: classification.confidence,
    conflict: false,
  };
}
