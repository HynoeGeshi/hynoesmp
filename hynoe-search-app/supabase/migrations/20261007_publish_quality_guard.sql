begin;

alter table public.hynoe_search_pages
  add constraint hynoe_search_pages_publish_ready
  check (
    publication_state <> 'published'
    or (
      char_length(btrim(summary)) > 0
      and char_length(btrim(description)) > 0
    )
  );

commit;
