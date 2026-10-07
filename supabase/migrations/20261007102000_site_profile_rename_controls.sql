-- Controlled Hynoe Community display-name changes.
-- One free correction, then a 30-day cooldown. Moderator changes bypass the cooldown.

alter table public.site_profiles
  add column if not exists rename_count integer not null default 0 check (rename_count >= 0),
  add column if not exists last_renamed_at timestamptz,
  add column if not exists previous_display_name text,
  add column if not exists previous_display_name_expires_at timestamptz;

create table if not exists public.site_profile_name_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.site_profiles(user_id) on delete cascade,
  old_display_name text not null,
  new_display_name text not null,
  changed_by uuid references public.site_profiles(user_id) on delete set null,
  change_type text not null check (change_type in ('self','moderator')),
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists site_profile_name_history_user_created_idx
  on public.site_profile_name_history (user_id, created_at desc);

alter table public.site_profile_name_history enable row level security;
revoke all on public.site_profile_name_history from public, anon, authenticated;

-- Profile names are now changed only through server-authoritative functions.
revoke update (display_name, normalized_name, avatar_seed) on public.site_profiles from authenticated;
drop policy if exists "site profile update self safe" on public.site_profiles;

create or replace function public.rename_site_profile(
  p_target_user_id uuid,
  p_new_display_name text,
  p_new_normalized_name text,
  p_actor_user_id uuid,
  p_moderator_override boolean default false,
  p_reason text default null
)
returns table (
  display_name text,
  rename_count integer,
  last_renamed_at timestamptz,
  previous_display_name text,
  previous_display_name_expires_at timestamptz,
  next_allowed_at timestamptz
)
security definer
set search_path = ''
language plpgsql
as $$
declare
  v_profile public.site_profiles%rowtype;
  v_now timestamptz := clock_timestamp();
  v_next timestamptz;
begin
  select * into v_profile
  from public.site_profiles
  where user_id = p_target_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if p_actor_user_id is null then
    raise exception 'actor_required';
  end if;

  if not p_moderator_override and p_actor_user_id <> p_target_user_id then
    raise exception 'rename_forbidden';
  end if;

  if exists (
    select 1 from public.site_profiles
    where user_id <> p_target_user_id
      and lower(normalized_name) = lower(p_new_normalized_name)
  ) then
    raise exception 'name_taken';
  end if;

  if v_profile.display_name = p_new_display_name then
    v_next := case
      when v_profile.rename_count > 0 and v_profile.last_renamed_at is not null
        then v_profile.last_renamed_at + interval '30 days'
      else null
    end;
    return query select v_profile.display_name, v_profile.rename_count, v_profile.last_renamed_at,
      v_profile.previous_display_name, v_profile.previous_display_name_expires_at, v_next;
    return;
  end if;

  if not p_moderator_override
     and v_profile.rename_count > 0
     and v_profile.last_renamed_at is not null
     and v_profile.last_renamed_at + interval '30 days' > v_now then
    raise exception 'rename_cooldown';
  end if;

  insert into public.site_profile_name_history (
    user_id, old_display_name, new_display_name, changed_by, change_type, reason
  ) values (
    p_target_user_id,
    v_profile.display_name,
    p_new_display_name,
    p_actor_user_id,
    case when p_moderator_override then 'moderator' else 'self' end,
    nullif(left(coalesce(p_reason, ''), 500), '')
  );

  update public.site_profiles
  set display_name = p_new_display_name,
      normalized_name = p_new_normalized_name,
      previous_display_name = v_profile.display_name,
      previous_display_name_expires_at = v_now + interval '7 days',
      rename_count = case when p_moderator_override then v_profile.rename_count else v_profile.rename_count + 1 end,
      last_renamed_at = case when p_moderator_override then v_profile.last_renamed_at else v_now end,
      updated_at = v_now
  where user_id = p_target_user_id
  returning * into v_profile;

  v_next := case
    when v_profile.rename_count > 0 and v_profile.last_renamed_at is not null
      then v_profile.last_renamed_at + interval '30 days'
    else null
  end;

  return query select v_profile.display_name, v_profile.rename_count, v_profile.last_renamed_at,
    v_profile.previous_display_name, v_profile.previous_display_name_expires_at, v_next;
end;
$$;

revoke all on function public.rename_site_profile(uuid, text, text, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.rename_site_profile(uuid, text, text, uuid, boolean, text)
  to service_role;

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
  (m.deleted_at is not null) as is_deleted,
  case
    when p.previous_display_name_expires_at is not null
      and p.previous_display_name_expires_at > now()
    then p.previous_display_name
    else null
  end as former_display_name
from public.site_chat_messages m
join public.site_profiles p on p.user_id = m.author_id;

grant select on public.site_chat_public_messages to authenticated;
