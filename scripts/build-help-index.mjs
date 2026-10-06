import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_HELP_SOURCES = Object.freeze([
  'index.html',
  'join.html',
  'start.html',
  'progression.html',
  'economy.html',
  'bosses.html',
  'modpack.html',
  'modded-minecraft-server.html',
  'updates.html',
  'mca.html',
  'llms.txt',
  'data/server-profile.json',
]);

const STOP_WORDS = new Set(['the','and','for','that','with','this','from','your','you','are','but','not','into','has','have','was','will','can','our','all','use','its','how','what','when','where','who','why','a','an','to','of','in','on','at','as','or','is','be','by','it']);

function decodeEntities(input) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(input ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function normalizeText(input) {
  return decodeEntities(input)
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(input) {
  return normalizeText(String(input ?? '').replace(/<[^>]*>/g, ' '));
}

function sourceUrl(source) {
  if (source === 'index.html') return '/';
  return `/${source.replace(/^\/+/, '')}`;
}

function tokensFor(...parts) {
  const found = new Set();
  const raw = parts.join(' ').toLowerCase().match(/\/[a-z0-9_-]+|[a-z0-9][a-z0-9'-]{1,}/g) ?? [];
  for (const token of raw) {
    if (STOP_WORDS.has(token)) continue;
    found.add(token);
    if (found.size >= 180) break;
  }
  return [...found].sort();
}

function stableId(page, heading, text) {
  return createHash('sha256').update(`${page}\0${heading}\0${text}`).digest('hex').slice(0, 16);
}

function detectDate(text) {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const named = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-3]?\d),\s+(20\d{2})\b/i);
  if (!named) return undefined;
  const parsed = new Date(`${named[1]} ${named[2]}, ${named[3]} 00:00:00 UTC`);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString().slice(0, 10);
}

function detectStatus(text) {
  const t = text.toLowerCase();
  if (/\b(not live|not active|setup pending|planned|coming soon|preview|announced|will be|being built)\b/.test(t)) return 'announced';
  if (/\b(live now|currently live|currently enabled|confirmed live|available now)\b/.test(t)) return 'confirmed';
  return undefined;
}

function splitBounded(text, maxLength = 1250) {
  const value = normalizeText(text);
  if (!value) return [];
  if (value.length <= maxLength) return [value];
  const sentences = value.split(/(?<=[.!?])\s+(?=[A-Z0-9/])/);
  const chunks = [];
  let current = '';
  const push = () => { if (current.trim()) chunks.push(current.trim()); current = ''; };
  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      push();
      for (let i = 0; i < sentence.length; i += maxLength) chunks.push(sentence.slice(i, i + maxLength).trim());
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxLength) push();
    current = current ? `${current} ${sentence}` : sentence;
  }
  push();
  return chunks.filter(Boolean);
}

function makeChunk({ page, title, heading, text }) {
  const normalized = normalizeText(text);
  const dated_at = detectDate(`${heading} ${normalized}`);
  const status = detectStatus(`${heading} ${normalized}`);
  return {
    id: stableId(page, heading, normalized),
    page,
    url: sourceUrl(page),
    title: title || 'Hynoe SMP',
    heading: heading || title || 'Hynoe SMP',
    text: normalized,
    ...(dated_at ? { dated_at } : {}),
    ...(status ? { status } : {}),
    tokens: tokensFor(title, heading, normalized),
  };
}

function htmlSections(raw, source) {
  const title = stripTags(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || 'Hynoe SMP');
  let html = raw
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<(script|style|nav|footer|form|button|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<meta\b[^>]*>/gi, ' ')
    .replace(/<link\b[^>]*>/gi, ' ');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (main) html = main;
  html = html
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => `\n@@H${level}@@ ${stripTags(content)}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|li|ul|ol|section|article|div|aside|details|summary|table|tr|td|th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const lines = normalizeText(html).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let heading = title || source;
  let buffer = [];
  const flush = () => {
    const text = normalizeText(buffer.join(' '));
    if (text) sections.push({ heading, text });
    buffer = [];
  };
  for (const line of lines) {
    const marker = line.match(/^@@H\d@@\s*(.+)$/);
    if (marker) {
      flush();
      heading = marker[1] || title || source;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return { title, sections };
}

function markdownSections(raw, source) {
  const lines = normalizeText(raw).split('\n');
  let title = source;
  let heading = source;
  let buffer = [];
  const sections = [];
  const flush = () => {
    const text = normalizeText(buffer.join(' '));
    if (text) sections.push({ heading, text });
    buffer = [];
  };
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      flush();
      heading = match[2].trim();
      if (match[1] === '#' && title === source) title = heading;
    } else if (line.trim()) {
      buffer.push(line.replace(/^[-*]\s+/, '• '));
    }
  }
  flush();
  return { title, sections };
}

function humanizeKey(key) {
  return String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function jsonSections(raw, source) {
  const value = JSON.parse(raw);
  const title = value.name || 'Hynoe SMP server profile';
  const lines = [];
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) continue;
    if (Array.isArray(entry)) lines.push(`${humanizeKey(key)}: ${entry.join('; ')}`);
    else if (typeof entry === 'object') lines.push(`${humanizeKey(key)}: ${JSON.stringify(entry)}`);
    else lines.push(`${humanizeKey(key)}: ${entry}`);
  }
  return { title, sections: [{ heading: 'Canonical server profile', text: lines.join('. ') }] };
}

async function sectionsFor(rootDir, source) {
  const raw = await readFile(path.join(rootDir, source), 'utf8');
  if (source.endsWith('.html')) return htmlSections(raw, source);
  if (source.endsWith('.json')) return jsonSections(raw, source);
  return markdownSections(raw, source);
}

export async function buildHelpIndex({ rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), sources = DEFAULT_HELP_SOURCES } = {}) {
  const chunks = [];
  for (const source of sources) {
    if (!DEFAULT_HELP_SOURCES.includes(source) && source !== 'watch.html') {
      throw new Error(`Unapproved help source: ${source}`);
    }
    const { title, sections } = await sectionsFor(rootDir, source);
    for (const section of sections) {
      for (const text of splitBounded(section.text)) {
        if (text.length < 8) continue;
        chunks.push(makeChunk({ page: source, title, heading: section.heading, text }));
      }
    }
  }
  return {
    version: 1,
    source_count: sources.length,
    chunk_count: chunks.length,
    sources: [...sources],
    chunks,
  };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const index = await buildHelpIndex({ rootDir, sources: DEFAULT_HELP_SOURCES });
  await writeFile(path.join(rootDir, 'data/hynoe-help-index.json'), `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Wrote ${index.chunk_count} Ask Hynoe chunks from ${index.source_count} approved sources.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
