import type { HynoePage, PageModule } from './types';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_MODULE_TYPES = new Set(['hero','links','features','services','portfolio','updates','community','media','cta']);

export function assertHttpsUrl(value: string, field = 'url'): void {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${field} must be a valid URL`); }
  if (url.protocol !== 'https:') throw new Error(`${field} must use HTTPS`);
}

function validateModule(module: PageModule): void {
  if (!SAFE_MODULE_TYPES.has(module.type)) throw new Error(`Unsupported module type: ${(module as {type?: string}).type ?? 'unknown'}`);
  if (module.type === 'links') module.links.forEach((link) => assertHttpsUrl(link.url, 'link url'));
  if (module.type === 'media') module.items.forEach((item) => assertHttpsUrl(item.url, 'media url'));
  if (module.type === 'cta') assertHttpsUrl(module.url, 'cta url');
  if (module.type === 'portfolio') {
    for (const item of module.items) if (item.imageUrl) assertHttpsUrl(item.imageUrl, 'portfolio image url');
  }
}

export function validateHynoePage(page: HynoePage): HynoePage {
  if (!page.id.trim()) throw new Error('id is required');
  if (!SLUG.test(page.slug)) throw new Error('slug must be lowercase kebab-case');
  if (!page.name.trim() || !page.summary.trim() || !page.description.trim()) throw new Error('name, summary, and description are required');
  assertHttpsUrl(page.canonicalUrl, 'canonicalUrl');
  page.modules.forEach(validateModule);
  return page;
}

export function validatePageCollection(pages: readonly HynoePage[]): readonly HynoePage[] {
  const slugs = new Set<string>();
  const ids = new Set<string>();
  for (const page of pages) {
    validateHynoePage(page);
    if (slugs.has(page.slug)) throw new Error(`Duplicate slug: ${page.slug}`);
    if (ids.has(page.id)) throw new Error(`Duplicate id: ${page.id}`);
    slugs.add(page.slug);
    ids.add(page.id);
  }
  return pages;
}
