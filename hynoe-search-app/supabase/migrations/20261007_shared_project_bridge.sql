begin;

create extension if not exists pgcrypto;

create table public.hynoe_search_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hynoe_search_pages (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  page_type text not null check (page_type in ('local_business','service_provider','creator','community','digital_product','project_brand')),
  name text not null check (char_length(name) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 240),
  description text not null default '' check (char_length(description) <= 5000),
  canonical_url text check (canonical_url is null or canonical_url ~ '^https://'),
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  location_label text check (location_label is null or char_length(location_label) <= 160),
  service_area text check (service_area is null or char_length(service_area) <= 240),
  social_links jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  portfolio jsonb not null default '[]'::jsonb,
  primary_cta jsonb,
  secondary_cta jsonb,
  publication_state text not null default 'draft' check (publication_state in ('draft','published')),
  published_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hynoe_search_page_members (
  page_id uuid not null references public.hynoe_search_pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','editor')),
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table public.hynoe_search_inquiries (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.hynoe_search_pages(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 100),
  sender_email text not null check (char_length(sender_email) between 3 and 320),
  message text not null check (char_length(message) between 1 and 4000),
  request_type text check (request_type is null or char_length(request_type) <= 80),
  status text not null default 'new' check (status in ('new','read','replied','closed','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hynoe_search_pages_publication_idx on public.hynoe_search_pages(publication_state);
create index hynoe_search_pages_created_by_idx on public.hynoe_search_pages(created_by);
create index hynoe_search_page_members_user_idx on public.hynoe_search_page_members(user_id);
create index hynoe_search_inquiries_page_created_idx on public.hynoe_search_inquiries(page_id, created_at desc);

create or replace function public.hynoe_search_has_page_role(target_page uuid, allowed_roles text[])
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

create or replace function public.hynoe_search_is_page_creator(target_page uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hynoe_search_pages p
    where p.id = target_page and p.created_by = auth.uid()
  );
$$;

revoke all on function public.hynoe_search_has_page_role(uuid, text[]) from public;
revoke all on function public.hynoe_search_is_page_creator(uuid) from public;
grant execute on function public.hynoe_search_has_page_role(uuid, text[]) to anon, authenticated;
grant execute on function public.hynoe_search_is_page_creator(uuid) to anon, authenticated;

alter table public.hynoe_search_profiles enable row level security;
alter table public.hynoe_search_pages enable row level security;
alter table public.hynoe_search_page_members enable row level security;
alter table public.hynoe_search_inquiries enable row level security;

revoke all on table public.hynoe_search_profiles from anon, authenticated;
revoke all on table public.hynoe_search_pages from anon, authenticated;
revoke all on table public.hynoe_search_page_members from anon, authenticated;
revoke all on table public.hynoe_search_inquiries from anon, authenticated;

grant select on table public.hynoe_search_pages to anon, authenticated;
grant select, insert, update on table public.hynoe_search_profiles to authenticated;
grant select, insert, update, delete on table public.hynoe_search_pages to authenticated;
grant select, insert, update, delete on table public.hynoe_search_page_members to authenticated;
grant select, update on table public.hynoe_search_inquiries to authenticated;

create policy "hynoe_search_profiles_select_own"
on public.hynoe_search_profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "hynoe_search_profiles_insert_own"
on public.hynoe_search_profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "hynoe_search_profiles_update_own"
on public.hynoe_search_profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "hynoe_search_pages_select"
on public.hynoe_search_pages for select to anon, authenticated
using (
  publication_state = 'published'
  or created_by = (select auth.uid())
  or public.hynoe_search_has_page_role(id, array['owner','manager','editor'])
);
create policy "hynoe_search_pages_insert"
on public.hynoe_search_pages for insert to authenticated
with check (created_by = (select auth.uid()));
create policy "hynoe_search_pages_update"
on public.hynoe_search_pages for update to authenticated
using (
  created_by = (select auth.uid())
  or public.hynoe_search_has_page_role(id, array['owner','manager','editor'])
)
with check (
  created_by = (select auth.uid())
  or public.hynoe_search_has_page_role(id, array['owner','manager','editor'])
);
create policy "hynoe_search_pages_delete"
on public.hynoe_search_pages for delete to authenticated
using (
  created_by = (select auth.uid())
  or public.hynoe_search_has_page_role(id, array['owner'])
);

create policy "hynoe_search_members_select"
on public.hynoe_search_page_members for select to authenticated
using (
  user_id = (select auth.uid())
  or public.hynoe_search_has_page_role(page_id, array['owner','manager','editor'])
  or public.hynoe_search_is_page_creator(page_id)
);
create policy "hynoe_search_members_insert"
on public.hynoe_search_page_members for insert to authenticated
with check (
  public.hynoe_search_is_page_creator(page_id)
  or public.hynoe_search_has_page_role(page_id, array['owner'])
);
create policy "hynoe_search_members_update"
on public.hynoe_search_page_members for update to authenticated
using (public.hynoe_search_has_page_role(page_id, array['owner']))
with check (public.hynoe_search_has_page_role(page_id, array['owner']));
create policy "hynoe_search_members_delete"
on public.hynoe_search_page_members for delete to authenticated
using (public.hynoe_search_has_page_role(page_id, array['owner']));

create policy "hynoe_search_inquiries_select"
on public.hynoe_search_inquiries for select to authenticated
using (
  public.hynoe_search_is_page_creator(page_id)
  or public.hynoe_search_has_page_role(page_id, array['owner','manager','editor'])
);
create policy "hynoe_search_inquiries_update"
on public.hynoe_search_inquiries for update to authenticated
using (
  public.hynoe_search_is_page_creator(page_id)
  or public.hynoe_search_has_page_role(page_id, array['owner','manager'])
)
with check (
  public.hynoe_search_is_page_creator(page_id)
  or public.hynoe_search_has_page_role(page_id, array['owner','manager'])
);

create or replace function public.hynoe_search_prevent_page_orphaning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (select count(*) from public.hynoe_search_page_members where page_id = old.page_id and role = 'owner') <= 1 then
      raise exception 'A Hynoe Page must retain at least one owner';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger hynoe_search_page_members_prevent_orphaning
before update or delete on public.hynoe_search_page_members
for each row execute function public.hynoe_search_prevent_page_orphaning();

commit;
