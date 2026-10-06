create table if not exists public.creatorops_public_metrics (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null unique,
  source text not null,
  verification_mode text not null check (verification_mode in ('manual_verified','automated_verified')),
  as_of timestamptz not null,
  verified_at timestamptz not null default now(),
  metrics jsonb not null check (jsonb_typeof(metrics) = 'object'),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creatorops_audit_reports (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.creatorops_applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  report_version integer not null default 1 check (report_version >= 1),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'ready' check (status in ('ready','superseded','revoked'))
);

create index if not exists creatorops_public_metrics_snapshot_key_idx on public.creatorops_public_metrics(snapshot_key);
create index if not exists creatorops_audit_reports_token_hash_idx on public.creatorops_audit_reports(token_hash);
create index if not exists creatorops_audit_reports_application_id_idx on public.creatorops_audit_reports(application_id);
create index if not exists creatorops_audit_reports_expires_at_idx on public.creatorops_audit_reports(expires_at);

alter table public.creatorops_public_metrics enable row level security;
alter table public.creatorops_audit_reports enable row level security;

revoke all on table public.creatorops_public_metrics from public, anon, authenticated;
revoke all on table public.creatorops_audit_reports from public, anon, authenticated;
grant select, insert, update, delete on table public.creatorops_public_metrics to service_role;
grant select, insert, update, delete on table public.creatorops_audit_reports to service_role;

create or replace function public.creatorops_create_or_rotate_audit(
  p_application jsonb,
  p_report jsonb,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table(duplicate boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_application_id uuid;
  v_application_created_at timestamptz;
  v_email text := lower(trim(coalesce(p_application->>'email','')));
  v_ready_report_id uuid;
begin
  if jsonb_typeof(p_application) <> 'object'
     or jsonb_typeof(p_report) <> 'object'
     or trim(coalesce(p_application->>'creatorName','')) = ''
     or v_email = ''
     or trim(coalesce(p_application->>'primaryPlatform','')) = ''
     or trim(coalesce(p_application->>'profileUrl','')) = ''
     or trim(coalesce(p_application->>'goal','')) = ''
     or trim(coalesce(p_application->>'bottleneck','')) = ''
     or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_expires_at <= now()
  then
    raise exception 'invalid_creatorops_audit_payload';
  end if;

  select a.id, a.created_at
    into v_application_id, v_application_created_at
  from public.creatorops_applications a
  where a.email = v_email
    and a.created_at >= now() - interval '10 minutes'
  order by a.created_at desc
  limit 1
  for update;

  if v_application_id is null then
    insert into public.creatorops_applications (
      creator_name,email,primary_platform,profile_url,goal,bottleneck,revenue,interest,source,status,user_agent_hash
    ) values (
      left(trim(p_application->>'creatorName'),120),
      v_email,
      left(trim(p_application->>'primaryPlatform'),40),
      left(trim(p_application->>'profileUrl'),500),
      left(trim(p_application->>'goal'),2000),
      left(trim(p_application->>'bottleneck'),2000),
      left(coalesce(nullif(trim(p_application->>'revenue'),''),'Prefer not to say'),80),
      left(coalesce(nullif(trim(p_application->>'interest'),''),'Free audit only'),120),
      'creatorops-audit',
      'new',
      case when coalesce(p_application->>'userAgentHash','') ~ '^[0-9a-f]{64}$' then p_application->>'userAgentHash' else null end
    )
    returning id, created_at into v_application_id, v_application_created_at;

    insert into public.creatorops_audit_reports(application_id,expires_at,report_version,report,token_hash,status)
    values (v_application_id,p_expires_at,1,p_report,p_token_hash,'ready');

    duplicate := false;
    created_at := v_application_created_at;
    return next;
    return;
  end if;

  select r.id into v_ready_report_id
  from public.creatorops_audit_reports r
  where r.application_id = v_application_id and r.status = 'ready'
  order by r.created_at desc
  limit 1
  for update;

  if v_ready_report_id is not null then
    update public.creatorops_audit_reports
      set report = p_report,
          report_version = 1,
          expires_at = p_expires_at,
          token_hash = p_token_hash
    where id = v_ready_report_id;
  else
    insert into public.creatorops_audit_reports(application_id,expires_at,report_version,report,token_hash,status)
    values (v_application_id,p_expires_at,1,p_report,p_token_hash,'ready');
  end if;

  duplicate := true;
  created_at := v_application_created_at;
  return next;
end;
$$;

revoke all on function public.creatorops_create_or_rotate_audit(jsonb,jsonb,text,timestamptz) from public, anon, authenticated;
grant execute on function public.creatorops_create_or_rotate_audit(jsonb,jsonb,text,timestamptz) to service_role;

insert into public.creatorops_public_metrics (
  snapshot_key, source, verification_mode, as_of, verified_at, metrics, notes
) values (
  'hynoe_youtube_case_study',
  'youtube_via_windsor_verified_snapshot',
  'manual_verified',
  '2026-10-06T21:06:30Z'::timestamptz,
  now(),
  jsonb_build_object(
    'subscribers',544,
    'views_30d',2349,
    'watch_minutes_30d',12762,
    'watch_hours_30d',212.7,
    'likes_30d',122,
    'comments_30d',36,
    'shares_30d',23,
    'subscribers_gained_30d',8,
    'subscribers_lost_30d',3,
    'net_subscribers_30d',5
  ),
  'Verified from connected YouTube Analytics via Windsor.ai on 2026-10-06.'
)
on conflict (snapshot_key) do update set
  source = excluded.source,
  verification_mode = excluded.verification_mode,
  as_of = excluded.as_of,
  verified_at = excluded.verified_at,
  metrics = excluded.metrics,
  notes = excluded.notes,
  updated_at = now();