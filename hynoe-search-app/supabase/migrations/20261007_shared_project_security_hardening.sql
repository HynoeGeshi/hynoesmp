begin;

create schema if not exists hynoe_search_private;
revoke all on schema hynoe_search_private from public;
grant usage on schema hynoe_search_private to anon, authenticated;

create or replace function hynoe_search_private.has_page_role(target_page uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hynoe_search_page_members pm
    where pm.page_id = target_page
      and pm.user_id = auth.uid()
      and pm.role = any(allowed_roles)
  );
$$;

create or replace function hynoe_search_private.is_page_creator(target_page uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hynoe_search_pages p
    where p.id = target_page
      and p.created_by = auth.uid()
  );
$$;

create or replace function hynoe_search_private.prevent_page_orphaning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (
      select count(*)
      from public.hynoe_search_page_members
      where page_id = old.page_id and role = 'owner'
    ) <= 1 then
      raise exception 'A Hynoe Page must retain at least one owner';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function hynoe_search_private.has_page_role(uuid, text[]) from public;
revoke all on function hynoe_search_private.is_page_creator(uuid) from public;
revoke all on function hynoe_search_private.prevent_page_orphaning() from public;
grant execute on function hynoe_search_private.has_page_role(uuid, text[]) to anon, authenticated;
grant execute on function hynoe_search_private.is_page_creator(uuid) to anon, authenticated;

drop policy if exists "hynoe_search_profiles_select_own" on public.hynoe_search_profiles;
drop policy if exists "hynoe_search_profiles_insert_own" on public.hynoe_search_profiles;
drop policy if exists "hynoe_search_profiles_update_own" on public.hynoe_search_profiles;
drop policy if exists "hynoe_search_pages_select" on public.hynoe_search_pages;
drop policy if exists "hynoe_search_pages_insert" on public.hynoe_search_pages;
drop policy if exists "hynoe_search_pages_update" on public.hynoe_search_pages;
drop policy if exists "hynoe_search_pages_delete" on public.hynoe_search_pages;
drop policy if exists "hynoe_search_members_select" on public.hynoe_search_page_members;
drop policy if exists "hynoe_search_members_insert" on public.hynoe_search_page_members;
drop policy if exists "hynoe_search_members_update" on public.hynoe_search_page_members;
drop policy if exists "hynoe_search_members_delete" on public.hynoe_search_page_members;
drop policy if exists "hynoe_search_inquiries_select" on public.hynoe_search_inquiries;
drop policy if exists "hynoe_search_inquiries_update" on public.hynoe_search_inquiries;

create policy "hynoe_search_profiles_select_own"
on public.hynoe_search_profiles for select to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

create policy "hynoe_search_profiles_insert_own"
on public.hynoe_search_profiles for insert to authenticated
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

create policy "hynoe_search_profiles_update_own"
on public.hynoe_search_profiles for update to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
)
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) = id
);

create policy "hynoe_search_pages_select"
on public.hynoe_search_pages for select to anon, authenticated
using (
  publication_state = 'published'
  or (
    (select (auth.jwt()->>'is_anonymous')::boolean) is false
    and (select auth.uid()) is not null
    and (
      created_by = (select auth.uid())
      or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
    )
  )
);

create policy "hynoe_search_pages_insert"
on public.hynoe_search_pages for insert to authenticated
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and created_by = (select auth.uid())
);

create policy "hynoe_search_pages_update"
on public.hynoe_search_pages for update to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
  )
)
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner','manager','editor'])
  )
);

create policy "hynoe_search_pages_delete"
on public.hynoe_search_pages for delete to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or hynoe_search_private.has_page_role(id, array['owner'])
  )
);

create policy "hynoe_search_members_select"
on public.hynoe_search_page_members for select to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager','editor'])
  )
);

create policy "hynoe_search_members_insert"
on public.hynoe_search_page_members for insert to authenticated
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner'])
  )
);

create policy "hynoe_search_members_update"
on public.hynoe_search_page_members for update to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
)
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
);

create policy "hynoe_search_members_delete"
on public.hynoe_search_page_members for delete to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and hynoe_search_private.has_page_role(page_id, array['owner'])
);

create policy "hynoe_search_inquiries_select"
on public.hynoe_search_inquiries for select to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager','editor'])
  )
);

create policy "hynoe_search_inquiries_update"
on public.hynoe_search_inquiries for update to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager'])
  )
)
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
  and (select auth.uid()) is not null
  and (
    hynoe_search_private.is_page_creator(page_id)
    or hynoe_search_private.has_page_role(page_id, array['owner','manager'])
  )
);

drop trigger if exists hynoe_search_page_members_prevent_orphaning on public.hynoe_search_page_members;
create trigger hynoe_search_page_members_prevent_orphaning
before update or delete on public.hynoe_search_page_members
for each row execute function hynoe_search_private.prevent_page_orphaning();

drop function if exists public.hynoe_search_has_page_role(uuid, text[]);
drop function if exists public.hynoe_search_is_page_creator(uuid);
drop function if exists public.hynoe_search_prevent_page_orphaning();

commit;
