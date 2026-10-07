import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { PublicDiscoverySection } from '@/components/home/public-discovery-section';
import { flagshipPages } from '@/data/flagship-pages';
import type { HynoePage } from '@/domain/pages/types';

vi.mock('@/components/home/public-discovery', () => ({
  PublicDiscovery: () => <div data-testid="public-discovery-slot" />,
}));

const publicCreator: HynoePage = {
  id: 'test-creator', slug: 'sample-creator', name: 'Sample Creator', pageType: 'creator',
  summary: 'Independent creative work.', description: 'Test fixture only.', categories: ['Art'],
  tags: [], status: 'published', featured: false, canonicalUrl: 'https://example.test', modules: [],
};

describe('homepage public discovery', () => {
  it('gives visitors a direct route to public Pages without signing in', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Public pages' })).toHaveAttribute('href', '#public-pages');
    expect(screen.getByTestId('public-discovery-slot')).toBeInTheDocument();
  });

  it('shows real published Pages, uses internal links and labels Hynoe-owned Pages', () => {
    render(<PublicDiscoverySection pages={[...flagshipPages, publicCreator]} />);
    const section = screen.getByRole('region', { name: 'Featured public pages' });
    expect(within(section).getByRole('link', { name: 'Open Sample Creator public page' }))
      .toHaveAttribute('href', '/p/sample-creator');
    expect(within(section).getAllByText('Hynoe Original').length).toBe(flagshipPages.filter(p => p.featured).slice(0, 3).length);
    expect(within(section).getByText(/not verification or an endorsement/i)).toBeInTheDocument();
  });

  it('keeps draft content out of the rendered public section', () => {
    render(<PublicDiscoverySection pages={[{ ...publicCreator, status: 'draft', featured: true }]} />);
    expect(screen.queryByText('Sample Creator')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create a Page/ })).toHaveAttribute('href', '/command-center/pages/new');
  });

  it('does not render HTML from an owner-supplied page name', () => {
    const name = '<img src=x onerror=alert(1)>';
    const { container } = render(<PublicDiscoverySection pages={[{ ...publicCreator, name }]} />);
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('keeps useful links available while community Pages load', () => {
    render(<PublicDiscoverySection pages={flagshipPages} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading community Pages');
    expect(screen.getByRole('link', { name: /Browse all public Pages/ })).toHaveAttribute('href', '/search');
    expect(screen.queryByText('Your work belongs here.')).not.toBeInTheDocument();
  });

  it('uses a truthful empty state instead of invented listings or engagement', () => {
    render(<PublicDiscoverySection pages={[]} />);
    expect(screen.getByText('Your work belongs here.')).toBeInTheDocument();
    expect(screen.getByText(/Drafts stay private/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open .* public page/ })).not.toBeInTheDocument();
  });
});
