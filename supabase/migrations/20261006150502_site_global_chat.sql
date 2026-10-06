-- Hynoe SMP website-native Global Chat schema.
-- Browser users read only safe public surfaces and never insert chat messages directly.

create extension if not exists pgcrypto;

create table if not exists public.site_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  normalized_name text not null check (char_length(normalized_name) between 1 and 24),
  role text not null default 'guest' check (role in ('guest','member','moderator','admin')),
  avatar_seed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_post_at timestamptz,
  muted_until timestamptz,
  banned_until timestamptz,
  is_banned boolean not null default false
);

create unique index if not exists site_profiles_normalized_name_idx
  on public.site_profiles (lower(normalized_name));

create table if not exists public.site_chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.site_profiles(user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  reply_to uuid references public.site_chat_messages(id) on delete set null,
  request_id uuid,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.site_profiles(user_id) on delete set null,
  moderation_reason text,
  unique (author_id, request_id)
);

create index if not exists site_chat_messages_created_at_idx
  on public.site_chat_messages (created_at desc);
create index if not exists site_chat_messages_reply_to_idx
  on public.site_chat_messages (reply_to);

create table if not exists public.site_chat_reactions (
  message_id uuid not null references public.site_chat_messages(id) on delete cascade,
  user_id uuid not null references public.site_profiles(user_id) on delete cascade,
  reaction text not null check (reaction in ('like','love','laugh','fire','wow')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create table if not exists public.site_chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.site_chat_messages(id) on delete cascade,
  reporter_id uuid not null references public.site_profiles(user_id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 80),
  details text check (details is null or char_length(details) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.site_profiles(user_id) on delete set null,
  unique (message_id, reporter_id)
);

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 500),
  link_url text,
  active boolean not null default true,
  created_by uuid references public.site_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.site_moderation_audit (
  id bigint generated always as identity primary key,
  action_type text not null,
  moderator_id uuid not null references public.site_profiles(user_id) on delete restrict,
  target_user_id uuid references public.site_profiles(user_id) on delete set null,
  target_message_id uuid references public.site_chat_messages(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_chat_settings (
  id boolean primary key default true check (id),
  posting_paused boolean not null default false,
  pause_message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.site_profiles(user_id) on delete set null
);

insert into public.site_chat_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.site_profiles enable row level security;
alter table public.site_chat_messages enable row level security;
alter table public.site_chat_reactions enable row level security;
alter table public.site_chat_reports enable row level security;
alter table public.site_announcements enable row level security;
alter table public.site_moderation_audit enable row level security;
alter table public.site_chat_settings enable row level security;

-- Explicit Data API permissions. Message writes are intentionally omitted.
revoke all on public.site_profiles from anon, authenticated;
revoke all on public.site_chat_messages from anon, authenticated;
revoke all on public.site_chat_reactions from anon, authenticated;
revoke all on public.site_chat_reports from anon, authenticated;
revoke all on public.site_announcements from anon, authenticated;
revoke all on public.site_moderation_audit from anon, authenticated;
revoke all on public.site_chat_settings from anon, authenticated;

grant select (user_id, display_name, role) on public.site_profiles to authenticated;
grant insert (user_id, display_name, normalized_name, avatar_seed) on public.site_profiles to authenticated;
grant update (display_name, normalized_name, avatar_seed) on public.site_profiles to authenticated;
grant select (id, author_id, body, reply_to, created_at, edited_at, deleted_at) on public.site_chat_messages to authenticated;

grant select, insert, delete on public.site_chat_reactions to authenticated;
grant insert (message_id, reporter_id, reason, details) on public.site_chat_reports to authenticated;
grant select on public.site_announcements to authenticated;
grant select on public.site_chat_settings to authenticated;

-- Profiles: anyone signed in may resolve safe display data, but may create/update only self.
create policy "site profiles readable by signed-in visitors"
on public.site_profiles for select
to authenticated
using (true);

create policy "site profile insert self"
on public.site_profiles for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and role = 'guest'
  and muted_until is null
  and banned_until is null
  and is_banned = false
);

create policy "site profile update self safe"
on public.site_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Base messages are server-written. Browser reads go through the security-invoker view below.
create policy "site messages readable by signed-in visitors"
on public.site_chat_messages for select
to authenticated
using (true);

create policy "site reactions readable"
on public.site_chat_reactions for select
to authenticated
using (true);

create policy "site reactions insert own"
on public.site_chat_reactions for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and reaction in ('like','love','laugh','fire','wow')
);

create policy "site reactions delete own"
on public.site_chat_reactions for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "site reports insert own"
on public.site_chat_reports for insert
to authenticated
with check ((select auth.uid()) = reporter_id);

create policy "site announcements readable when active"
on public.site_announcements for select
to authenticated
using (active and (expires_at is null or expires_at > now()));

create policy "site settings readable"
on public.site_chat_settings for select
to authenticated
using (true);

create or replace view public.site_chat_public_messages
with (security_invoker = true)
as
select
  m.id,
  m.author_id,
  p.display_name,
  case when p.role in ('moderator','admin') then p.role else null end as staff_role,
  case when m.deleted_at is null then m.body else null end as body,
  m.reply_to,
  m.created_at,
  m.edited_at,
  m.deleted_at,
  (m.deleted_at is not null) as is_deleted
from public.site_chat_messages m
join public.site_profiles p on p.user_id = m.author_id;

grant select on public.site_chat_public_messages to authenticated;

-- Server-only atomic cooldown claim. Secret-key callers execute as the backend role;
-- normal visitors receive no EXECUTE grant.
create or replace function public.claim_site_chat_post_slot(
  p_user_id uuid,
  p_now timestamptz,
  p_min_spacing interval default interval '3 seconds'
)
returns boolean
security invoker
language plpgsql
as $$
declare
  claimed uuid;
begin
  update public.site_profiles
  set last_post_at = p_now, updated_at = p_now
  where user_id = p_user_id
    and is_banned = false
    and (banned_until is null or banned_until <= p_now)
    and (muted_until is null or muted_until <= p_now)
    and (last_post_at is null or last_post_at <= p_now - p_min_spacing)
  returning user_id into claimed;
  return claimed is not null;
end;
$$;

revoke all on function public.claim_site_chat_post_slot(uuid, timestamptz, interval) from public, anon, authenticated;
grant execute on function public.claim_site_chat_post_slot(uuid, timestamptz, interval) to service_role;

-- Private topic authorization: visitors receive database broadcasts + presence,
-- but browser clients may only publish presence state themselves.
create policy "site global realtime receive"
on realtime.messages
for select
to authenticated
using (
  (select realtime.topic()) = 'site:global'
  and realtime.messages.extension in ('broadcast','presence')
);

create policy "site global realtime presence publish"
on realtime.messages
for insert
to authenticated
with check (
  (select realtime.topic()) = 'site:global'
  and realtime.messages.extension = 'presence'
);

-- A tombstoned message cannot be recovered through direct safe-column reads.
create or replace function public.scrub_deleted_site_chat_message()
returns trigger
security invoker
language plpgsql
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    new.body := '[message removed]';
  end if;
  return new;
end;
$$;

create trigger site_chat_messages_scrub_deleted_trigger
before update on public.site_chat_messages
for each row execute function public.scrub_deleted_site_chat_message();

-- Database-authoritative message changes are broadcast privately.
create or replace function public.broadcast_site_chat_message_change()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'site:global',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

revoke all on function public.broadcast_site_chat_message_change() from public;

create trigger site_chat_messages_broadcast_trigger
after insert or update or delete on public.site_chat_messages
for each row execute function public.broadcast_site_chat_message_change();

create trigger site_chat_reactions_broadcast_trigger
after insert or delete on public.site_chat_reactions
for each row execute function public.broadcast_site_chat_message_change();

create trigger site_announcements_broadcast_trigger
after insert or update or delete on public.site_announcements
for each row execute function public.broadcast_site_chat_message_change();
