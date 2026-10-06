type Props = { defaultValue?: string };
export function SearchForm({ defaultValue = '' }: Props) {
  return (
    <form action="/search" method="get" className="search-form">
      <input aria-label="Search Hynoe" name="q" defaultValue={defaultValue} placeholder="What are you looking for?" />
      <button type="submit">Search</button>
    </form>
  );
}
