'use client';

import { recordQuery } from '@/domain/retention/browser-retention-store';
import { trackEvent } from '@/lib/analytics/track-event';

type Props = { defaultValue?: string };

export function SearchForm({ defaultValue = '' }: Props) {
  return (
    <form
      action="/search"
      method="get"
      className="search-form"
      onSubmit={(event) => {
        const form = new FormData(event.currentTarget);
        const query = String(form.get('q') ?? '').trim();
        recordQuery(query);
        trackEvent('search_submitted', {
          has_query: query.length > 0,
          query_length: query.length,
          source: 'search_form',
        });
      }}
    >
      <input aria-label="Search Hynoe" name="q" defaultValue={defaultValue} placeholder="What are you looking for?" />
      <button type="submit">Search</button>
    </form>
  );
}
