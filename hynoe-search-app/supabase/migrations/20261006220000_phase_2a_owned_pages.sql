create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  page_type text not null,
  name text not null check (char_length(name) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 320),
  description text not null default '' check (char_length(description) <= 10000),
  canonical_url text check (canonical_url is null or canonical_url ~ '^https://'),
  publication_state text not null default 'draft' check (publication_state in ('draft', 'published')),
  location_text text,
  service_area text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  modules jsonb not null default '[]'::jsonb check (jsonb_typeof(modules) = 'array'),
  primary_cta_label text,
  primary_cta_url text check (primary_cta_url is null or primary_cta_url ~ '^https://'),
  secondary_cta_label text,
  secondary_cta_url text check (secondary_cta_url is null or secondary_cta_url ~ '^https://'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_members (
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'editor', 'operator')),
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 120),
  sender_email text not null check (char_length(sender_email) between 3 and 320),
  message text not null check (char_length(message) between 1 and 5000),
  request_type text check (request_type is null or char_length(request_type) <= 80),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_members_user_id_idx on public.page_members(user_id);
create index page_members_page_id_role_idx on public.page_members(page_id, role);
create index pages_publication_state_idx on public.pages(publication_state);
create index inquiries_page_id_created_at_idx on public.inquiries(page_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_members enable row level security;
alter table public.inquiries enable row level security;

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

create policy "pages_public_read_published"
on public.pages for select
to anon
using (publication_state = 'published');

create policy "pages_authenticated_read"
on public.pages for select
to authenticated
using (
  publication_state = 'published'
  or exists (
    select 1
    from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
  )
);

create policy "pages_members_update"
on public.pages for update
to authenticated
using (
  exists (
    select 1
    from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner', 'manager', 'editor', 'operator')
  )
)
with check (
  exists (
    select 1
    from public.page_members pm
    where pm.page_id = pages.id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner', 'manager', 'editor', 'operator')
  )
);

create policy "page_members_select_own"
on public.page_members for select
to authenticated
using (user_id = (select auth.uid()));

create policy "inquiries_members_read"
on public.inquiries for select
to authenticated
using (
  exists (
    select 1
    from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
  )
);

create policy "inquiries_members_update"
on public.inquiries for update
to authenticated
using (
  exists (
    select 1
    from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner', 'manager', 'editor', 'operator')
  )
)
with check (
  exists (
    select 1
    from public.page_members pm
    where pm.page_id = inquiries.page_id
      and pm.user_id = (select auth.uid())
      and pm.role in ('owner', 'manager', 'editor', 'operator')
  )
);

-- Browser roles can read the rows allowed by RLS. Mutating page ownership,
-- creating pages, and creating inquiries are intentionally performed through
-- constrained server paths rather than broad browser table grants.
grant select on public.pages to anon, authenticated;
grant select on public.page_members to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, update on public.inquiries to authenticated;
grant update on public.pages to authenticated;

revoke insert, delete on public.pages from anon, authenticated;
revoke insert, update, delete on public.page_members from anon, authenticated;
revoke insert, delete on public.inquiries from anon, authenticated;
