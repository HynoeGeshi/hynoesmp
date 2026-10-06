create table public.site_help_request_metrics (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('pending','retrieval','model')),
  confidence text not null check (confidence in ('low','medium','high')),
  source_count smallint not null default 0 check (source_count between 0 and 12),
  latency_ms integer check (latency_ms is null or latency_ms between 0 and 120000),
  created_at timestamptz not null default now()
);
alter table public.site_help_request_metrics enable row level security;
revoke all on public.site_help_request_metrics from public, anon, authenticated;
create index site_help_request_metrics_user_created_idx on public.site_help_request_metrics (user_id, created_at desc);

-- Atomic server-only reservation prevents concurrent requests from racing past the per-minute cap.
create or replace function public.claim_site_help_request_slot(
  p_user_id uuid,
  p_request_id uuid,
  p_now timestamptz,
  p_max_requests integer default 8,
  p_window interval default interval '1 minute'
)
returns boolean
security invoker
language plpgsql
as $$
declare
  recent_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select count(*) into recent_count
  from public.site_help_request_metrics
  where user_id = p_user_id and created_at >= p_now - p_window;
  if recent_count >= p_max_requests then return false; end if;
  insert into public.site_help_request_metrics(request_id,user_id,mode,confidence,source_count,created_at)
  values (p_request_id,p_user_id,'pending','low',0,p_now);
  return true;
end;
$$;
revoke all on function public.claim_site_help_request_slot(uuid, uuid, timestamptz, integer, interval) from public, anon, authenticated;
grant execute on function public.claim_site_help_request_slot(uuid, uuid, timestamptz, integer, interval) to service_role;
