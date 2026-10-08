create schema if not exists hynoe_chat_private;
revoke all on schema hynoe_chat_private from public, anon, authenticated;
create table hynoe_chat_private.minecraft_post_requests (
  user_id uuid not null references public.site_profiles(user_id) on delete cascade,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table hynoe_chat_private.minecraft_post_requests enable row level security;
revoke all on hynoe_chat_private.minecraft_post_requests from public, anon, authenticated;
create or replace function public.claim_minecraft_chat_post(p_request_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
begin
  if v_user is null or p_request_id is null then
    raise exception 'Sign in is required.';
  end if;
  if exists (select 1 from public.site_chat_settings where id = true and posting_paused) then
    raise exception 'Chat is paused.';
  end if;
  update public.site_profiles
    set last_post_at = now(), updated_at = now()
    where user_id = v_user and not is_banned
      and (banned_until is null or banned_until <= now())
      and (muted_until is null or muted_until <= now())
      and (last_post_at is null or last_post_at <= now() - interval '15 seconds')
    returning display_name into v_name;
  if v_name is null then raise exception 'Posting unavailable or cooldown active.'; end if;
  -- A duplicate request raises and rolls back the cooldown update. No provider writes are retried.
  insert into hynoe_chat_private.minecraft_post_requests(user_id,request_id) values (v_user,p_request_id);
  delete from hynoe_chat_private.minecraft_post_requests where user_id = v_user and created_at < now() - interval '7 days';
  return v_name;
end;
$$;
revoke all on function public.claim_minecraft_chat_post(uuid) from public, anon;
grant execute on function public.claim_minecraft_chat_post(uuid) to authenticated;
