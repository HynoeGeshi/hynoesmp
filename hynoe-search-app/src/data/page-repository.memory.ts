import type { HynoePage, PageRepository } from '../domain/pages/types';

function clonePage(page: HynoePage): HynoePage {
  return structuredClone(page);
}

export function createMemoryPageRepository(pages: readonly HynoePage[]): PageRepository {
  const snapshot = pages.map(clonePage);
  return {
    async list() { return snapshot.map(clonePage); },
    async getBySlug(slug: string) {
      const page = snapshot.find((item) => item.slug === slug);
      return page ? clonePage(page) : null;
    },
  };
}
