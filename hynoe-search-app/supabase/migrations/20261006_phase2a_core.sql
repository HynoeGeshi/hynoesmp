begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
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

create table public.page_members (
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','editor')),
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 100),
  sender_email text not null check (char_length(sender_email) between 3 and 320),
  message text not null check (char_length(message) between 1 and 4000),
  request_type text check (request_type is null or char_length(request_type) <= 80),
  status text not null default 'new' check (status in ('new','read','replied','closed','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pages_publication_state_idx on public.pages(publication_state);
create index pages_created_by_idx on public.pages(created_by);
create index page_members_user_id_idx on public.page_members(user_id);
create index inquiries_page_id_created_at_idx on public.inquiries(page_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_members enable row level security;
alter table public.inquiries enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.pages from anon, authenticated;
revoke all on table public.page_members from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;

revoke insert on table public.inquiries from anon;
revoke insert on table public.inquiries from authenticated;

grant select on table public.pages to anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.pages to authenticated;
grant select, insert, update, delete on table public.page_members to authenticated;
grant select, update on table public.inquiries to authenticated;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "pages_public_or_member_select"
on public.pages for select
to anon, authenticated
using (
  publication_state = 'published'
  or created_by = (select auth.uid())
  or exists (
    select 1 from public.page_members pm
    where pm.page_id = pages.id and pm.user_id = (select auth.uid())
  )
);

create policy "pages_authenticated_insert"
on public.pages for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "pages_member_update"
on public.pages for update
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner','manager','editor')
  )
)
with check (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner','manager','editor')
  )
);

create policy "pages_owner_delete"
on public.pages for delete
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
      and pm.role = 'owner'
  )
);

create policy "page_members_member_select"
on public.page_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.page_members viewer
    where viewer.page_id = page_members.page_id
      and viewer.user_id = (select auth.uid())
  )
);

create policy "page_members_owner_insert"
on public.page_members for insert
to authenticated
with check (
  exists (
    select 1 from public.pages p
    where p.id = page_members.page_id
      and p.created_by = (select auth.uid())
  )
  or exists (
    select 1 from public.page_members owner_member
    where owner_member.page_id = page_members.page_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
  )
);

create policy "page_members_owner_update"
on public.page_members for update
to authenticated
using (
  exists (
    select 1 from public.page_members owner_member
    where owner_member.page_id = page_members.page_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.page_members owner_member
    where owner_member.page_id = page_members.page_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
  )
);

create policy "page_members_owner_delete"
on public.page_members for delete
to authenticated
using (
  exists (
    select 1 from public.page_members owner_member
    where owner_member.page_id = page_members.page_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
  )
);

create policy "inquiries_page_member_select"
on public.inquiries for select
to authenticated
using (
  exists (
    select 1 from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.pages p
    where p.id = inquiries.page_id and p.created_by = (select auth.uid())
  )
);

create policy "inquiries_page_member_update"
on public.inquiries for update
to authenticated
using (
  exists (
    select 1 from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner','manager')
  )
  or exists (
    select 1 from public.pages p
    where p.id = inquiries.page_id and p.created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner','manager')
  )
  or exists (
    select 1 from public.pages p
    where p.id = inquiries.page_id and p.created_by = (select auth.uid())
  )
);

create or replace function public.prevent_page_orphaning()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (select count(*) from public.page_members where page_id = old.page_id and role = 'owner') <= 1 then
      raise exception 'A page must retain at least one owner';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger page_members_prevent_orphaning
before update or delete on public.page_members
for each row execute function public.prevent_page_orphaning();

commit;
