import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn(async () => ({ id: 'user-1', email: 'owner@example.com' }));
const listOwnedPages = vi.fn();

vi.mock('@/lib/auth/require-user', () => ({ requireUser }));
vi.mock('@/lib/pages/list-owned-pages', () => ({ listOwnedPages }));

describe('Command Center My Page', () => {
  beforeEach(() => {
    requireUser.mockClear();
    listOwnedPages.mockReset();
  });

  it('shows a safe first-Page creation form when the user owns no Pages', async () => {
    listOwnedPages.mockResolvedValue([]);
    const { default: MyPageScreen } = await import('@/app/command-center/my-page/page');
    const view = await MyPageScreen();
    const { container } = render(view);

    expect(requireUser).toHaveBeenCalledWith('/command-center/my-page');
    expect(listOwnedPages).toHaveBeenCalledWith('user-1');
    expect(screen.getByRole('heading', { name: /create your hynoe page/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/page name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/page url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/page type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create draft page/i })).toBeInTheDocument();
    expect(container.querySelector('form')).toHaveAttribute('action', '/command-center/my-page/create');
  });

  it('shows the owned Page status and public-preview link instead of another create form', async () => {
    listOwnedPages.mockResolvedValue([
      {
        id: 'page-1',
        slug: 'hynoe-studio',
        name: 'Hynoe Studio',
        pageType: 'creator',
        publicationState: 'draft',
        summary: '',
        description: '',
        canonicalUrl: null,
        locationText: null,
        serviceArea: null,
        categories: [],
        tags: [],
        modules: [],
        primaryCtaLabel: null,
        primaryCtaUrl: null,
        secondaryCtaLabel: null,
        secondaryCtaUrl: null,
        role: 'owner',
      },
    ]);
    const { default: MyPageScreen } = await import('@/app/command-center/my-page/page');
    const view = await MyPageScreen();
    render(view);

    expect(screen.getByRole('heading', { name: 'Hynoe Studio' })).toBeInTheDocument();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview public page/i })).toHaveAttribute('href', '/p/hynoe-studio');
    expect(screen.queryByRole('button', { name: /create draft page/i })).not.toBeInTheDocument();
  });
});
