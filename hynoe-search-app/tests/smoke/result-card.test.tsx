import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultCard } from '@/components/search/result-card';
import type { SearchResult } from '@/domain/search/types';

const baseResult: SearchResult = {
  score: 100,
  matchedFields: ['name'],
  page: {
    id: 'page-1',
    slug: 'sample-creator',
    name: 'Sample Creator',
    pageType: 'creator',
    summary: 'Independent creator making useful things.',
    description: 'Longer description.',
    categories: ['Gaming Creators'],
    tags: ['gaming', 'streaming'],
    status: 'published',
    featured: false,
    canonicalUrl: 'https://example.com',
    location: { city: 'Chicago', region: 'IL', country: 'US' },
    modules: [],
  },
};

describe('ResultCard', () => {
  it('renders only real structured result data and one primary page CTA', () => {
    const { container } = render(<ResultCard result={baseResult} />);

    expect(screen.getByRole('heading', { name: 'Sample Creator' })).toBeInTheDocument();
    expect(screen.getByText('Gaming Creators')).toBeInTheDocument();
    expect(screen.getByText('Independent creator making useful things.')).toBeInTheDocument();
    expect(screen.getByText('Chicago, IL, US')).toBeInTheDocument();
    expect(screen.getByText('gaming')).toBeInTheDocument();
    expect(screen.getByText('streaming')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View Hynoe Page' })).toHaveLength(1);
    expect(container).not.toHaveTextContent(/rating|verified|starting at|reviews/i);
  });

  it('shows Online for online-only Pages instead of leaving discovery context blank', () => {
    const result: SearchResult = {
      ...baseResult,
      page: {
        ...baseResult.page,
        location: { onlineOnly: true, country: 'US' },
      },
    };

    render(<ResultCard result={result} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('does not render an empty tag surface when a page has no tags', () => {
    const result: SearchResult = {
      ...baseResult,
      page: { ...baseResult.page, tags: [] },
    };

    const { container } = render(<ResultCard result={result} />);
    expect(container.querySelector('.tag-row')).toBeNull();
  });
});
