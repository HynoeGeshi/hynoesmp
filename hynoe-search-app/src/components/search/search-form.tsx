'use client';

import { recordQuery } from '@/domain/retention/browser-retention-store';

type Props = { defaultValue?: string };

export function SearchForm({ defaultValue = '' }: Props) {
  return (
    <form
      action="/search"
      method="get"
      className="search-form"
      onSubmit={(event) => {
        const form = new FormData(event.currentTarget);
        recordQuery(String(form.get('q') ?? ''));
      }}
    >
      <input aria-label="Search Hynoe" name="q" defaultValue={defaultValue} placeholder="What are you looking for?" />
      <button type="submit">Search</button>
    </form>
  );
}
