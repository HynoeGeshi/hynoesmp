import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublishedDatabasePages } from '@/lib/pages/public-pages';

const mock = vi.hoisted(() => {
  const result = { data: [] as unknown[], error: null as null | { message: string } };
  const query = {
    ...result,
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return { query, from: vi.fn().mockReturnValue(query) };
});
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: mock.from }) }));

beforeEach(() => { vi.clearAllMocks(); mock.query.data = []; mock.query.error = null; });

describe('bounded homepage public query', () => {
  it('limits homepage reads and still requires publication', async () => {
    await getPublishedDatabasePages(12);
    expect(mock.query.limit).toHaveBeenCalledWith(12);
    expect(mock.query.eq).toHaveBeenCalledWith('publication_state', 'published');
    expect(mock.query.select).toHaveBeenCalledWith('id, slug, name, page_type, summary, description, canonical_url, categories, tags, publication_state');
  });
  it('does not add the homepage limit to full Search', async () => {
    await getPublishedDatabasePages();
    expect(mock.query.limit).not.toHaveBeenCalled();
  });
  it('bounds a supplied limit to a safe positive range', async () => {
    await getPublishedDatabasePages(9999);
    expect(mock.query.limit).toHaveBeenLastCalledWith(48);
    await getPublishedDatabasePages(-1);
    expect(mock.query.limit).toHaveBeenLastCalledWith(1);
  });
  it('does not leak database errors to visitors', async () => {
    mock.query.error = { message: 'Internal test error' };
    await expect(getPublishedDatabasePages(12)).resolves.toEqual([]);
  });
});
