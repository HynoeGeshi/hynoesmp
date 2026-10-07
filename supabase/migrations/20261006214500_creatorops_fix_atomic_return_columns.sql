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
  from public.creatorops_applications as a
  where a.email = v_email
    and a.created_at >= now() - interval '10 minutes'
  order by a.created_at desc
  limit 1
  for update;

  if v_application_id is null then
    insert into public.creatorops_applications as a (
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
    returning a.id, a.created_at into v_application_id, v_application_created_at;

    insert into public.creatorops_audit_reports(application_id,expires_at,report_version,report,token_hash,status)
    values (v_application_id,p_expires_at,1,p_report,p_token_hash,'ready');

    duplicate := false;
    created_at := v_application_created_at;
    return next;
    return;
  end if;

  select r.id into v_ready_report_id
  from public.creatorops_audit_reports as r
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
