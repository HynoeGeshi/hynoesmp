begin;

alter policy "hynoe_search_profiles_select_own"
on public.hynoe_search_profiles
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

alter policy "hynoe_search_profiles_insert_own"
on public.hynoe_search_profiles
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

alter policy "hynoe_search_profiles_update_own"
on public.hynoe_search_profiles
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
)
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

alter policy "hynoe_search_pages_select"
on public.hynoe_search_pages
using (
  publication_state = 'published'
  or (
    (((select auth.jwt())->>'is_anonymous')::boolean) is false
    and (select auth.uid()) is not null
    and (
      created_by = (select auth.uid())
      or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
    )
  )
);

alter policy "hynoe_search_pages_insert"
on public.hynoe_search_pages
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and created_by = (select auth.uid())
);

alter policy "hynoe_search_pages_update"
on public.hynoe_search_pages
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
  )
)
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
  )
);

alter policy "hynoe_search_pages_delete"
on public.hynoe_search_pages
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner'])
  )
);

alter policy "hynoe_search_members_select"
on public.hynoe_search_page_members
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager','editor'])
  )
);

alter policy "hynoe_search_members_insert"
on public.hynoe_search_page_members
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner'])
  )
);

alter policy "hynoe_search_members_update"
on public.hynoe_search_page_members
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
)
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
);

alter policy "hynoe_search_members_delete"
on public.hynoe_search_page_members
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
);

alter policy "hynoe_search_inquiries_select"
on public.hynoe_search_inquiries
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager','editor'])
  )
);

alter policy "hynoe_search_inquiries_update"
on public.hynoe_search_inquiries
using (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager'])
  )
)
with check (
  (((select auth.jwt())->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager'])
  )
);

commit;
