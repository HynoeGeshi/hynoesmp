CREATE OR REPLACE FUNCTION private.approve_clip_upload_impl(p_clip_id uuid, p_package jsonb, p_confirmation_text text)
 RETURNS TABLE(publishing_job_id uuid, upload_approval_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.clip_candidates; j public.publishing_jobs; a uuid;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if p_confirmation_text is distinct from 'I approve this exact YouTube upload' then raise exception 'exact confirmation required'; end if;
 select * into c from public.clip_candidates where id=p_clip_id for update;
 if not found or not exists(select 1 from private.youtube_owner_authority o join public.channels ch on ch.id=o.channel_id
   where o.channel_id=c.channel_id and o.owner_user_id=auth.uid() and ch.owner_user_id=o.owner_user_id
   and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe') then raise exception 'channel not owned'; end if;
 if c.score<80 or c.render_status is distinct from 'ready' or c.render_uri is null then raise exception '80+ score and finished private render required'; end if;
 if coalesce(p_package->>'media_sha256','') !~ '^[a-f0-9]{64}$'
    or p_package is distinct from private.youtube_upload_package(c.id,p_package->>'media_sha256') then raise exception 'exact upload package required'; end if;
 select * into j from public.publishing_jobs where clip_candidate_id=c.id order by created_at desc limit 1 for update;
 if found and (j.youtube_video_id is not null or j.state in ('uploading','published','uploaded_private','scheduled')) then raise exception 'upload already started or video exists'; end if;
 if j.id is null then
  insert into public.publishing_jobs(channel_id,clip_candidate_id,state) values(c.channel_id,c.id,'awaiting_review') returning * into j;
 end if;
 update public.youtube_upload_approvals set revoked_at=now() where clip_candidate_id=c.id and consumed_at is null and revoked_at is null;
 insert into public.youtube_upload_approvals(channel_id,clip_candidate_id,publishing_job_id,approved_by,action,package,confirmation_text)
  values(c.channel_id,c.id,j.id,auth.uid(),'upload_private',p_package,p_confirmation_text) returning id into a;
 update public.clip_candidates set approval_state='approved',approved_at=now(),updated_at=now() where id=c.id;
 update public.publishing_jobs set state='pending',error_code=null,error_message=null,updated_at=now() where id=j.id;
 return query select j.id,a;
end $function$;

CREATE OR REPLACE FUNCTION private.guard_youtube_upload_review_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.state='pending' and not exists(
  select 1 from public.youtube_upload_approvals a
  join public.clip_candidates c on c.id=a.clip_candidate_id
  join private.youtube_owner_authority o on o.channel_id=a.channel_id and o.owner_user_id=a.approved_by
  where a.publishing_job_id=new.id and a.channel_id=new.channel_id and a.clip_candidate_id=new.clip_candidate_id
   and a.action='upload_private' and a.confirmation_text='I approve this exact YouTube upload'
   and a.revoked_at is null and a.consumed_at is null and new.youtube_video_id is null
   and c.score>=80 and c.render_status='ready'
   and a.package=private.youtube_upload_package(c.id,a.package->>'media_sha256')
 ) then new.state:='awaiting_review'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.revoke_upload_consent_on_clip_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.title is distinct from old.title or new.description is distinct from old.description
  or new.hashtags is distinct from old.hashtags or new.render_uri is distinct from old.render_uri
  or new.render_status is distinct from old.render_status or new.video_source_id is distinct from old.video_source_id
  or new.start_ms is distinct from old.start_ms or new.end_ms is distinct from old.end_ms
  or new.score<80 or new.approval_state='rejected' then
  update public.youtube_upload_approvals set revoked_at=now() where clip_candidate_id=old.id and revoked_at is null and consumed_at is null;
  update public.publishing_jobs set state='awaiting_review',error_code='exact_owner_approval_required',updated_at=now()
   where clip_candidate_id=old.id and youtube_video_id is null and state in ('pending','failed_retryable');
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.youtube_approved_short_schedule_package_valid(p_channel_id uuid, p_resource_id text, p_package jsonb, p_historical boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare before_ jsonb:=p_package->'before'; after_ jsonb:=p_package->'after'; policy_ jsonb:=p_package->'policy';
  status_ jsonb:=before_->'status'; snippet_ jsonb:=before_->'snippet'; upload_ public.youtube_upload_approvals;
  structural_ jsonb; owner_ uuid; publish_at_ timestamptz; publish_text_ text:=policy_->>'publish_at';
begin
  if p_historical is null
    or not private.youtube_change_exact_keys(p_package,array['action','resource_id','channel_id','youtube_channel_id','before','after','policy'])
    or p_package->>'action' is distinct from 'schedule_approved_short'
    or p_package->>'resource_id' is distinct from p_resource_id or p_package->>'channel_id' is distinct from p_channel_id::text
    or p_resource_id !~ '^[A-Za-z0-9_-]{11}$'
    or not private.youtube_change_exact_keys(before_,array['owned_channel_id','snippet','status','upload_status'])
    or before_->>'upload_status' is distinct from 'processed'
    or status_->>'privacyStatus' is distinct from 'private' or status_ ? 'publishAt'
    or not private.youtube_change_exact_keys(policy_,array['kind','publishing_job_id','clip_candidate_id','upload_approval_id','media_sha256','publish_at'])
    or policy_->>'kind' is distinct from 'approved_private_short_schedule'
    or jsonb_typeof(policy_->'publish_at') is distinct from 'string'
    or publish_text_ !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
    or not private.youtube_change_exact_keys(after_,array['api','part','body'])
    or after_->>'api' is distinct from 'videos' or after_->>'part' is distinct from 'status'
    or not private.youtube_change_exact_keys(after_->'body',array['id','status'])
    or after_->'body'->>'id' is distinct from p_resource_id
    or after_->'body'->'status' is distinct from (status_||jsonb_build_object('privacyStatus','private','publishAt',publish_text_))
    then return false; end if;
  publish_at_:=publish_text_::timestamptz;
  if to_char(publish_at_ at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') is distinct from publish_text_
    or (not p_historical and publish_at_<now()+interval '15 minutes') then return false; end if;

  -- A caller cannot restore fresh eligibility by resetting a job to private.
  -- Previously verified release/scheduling/public-metadata receipts remain
  -- authoritative. Consumed historical readback is checked separately below.
  if not p_historical and exists(select 1 from public.youtube_owner_change_requests r
    where r.channel_id=p_channel_id and r.resource_id=p_resource_id and r.state='applied'
      and (r.action in ('publish_approved_short','restore_week_upload_visibility','schedule_approved_short')
        or (r.action='public_video_metadata' and r.package->'before'->'status'->>'privacyStatus'='public')))
    then return false; end if;

  select o.owner_user_id into owner_ from private.youtube_owner_authority o
    join public.channels ch on ch.id=o.channel_id and ch.owner_user_id=o.owner_user_id
    where o.channel_id=p_channel_id and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe';
  if owner_ is null then return false; end if;
  select * into upload_ from public.youtube_upload_approvals where id=(policy_->>'upload_approval_id')::uuid;
  if not found or upload_.clip_candidate_id::text is distinct from policy_->>'clip_candidate_id'
    or not exists(select 1 from public.youtube_upload_approvals a
      join public.publishing_jobs j on j.id=a.publishing_job_id and j.channel_id=a.channel_id and j.clip_candidate_id=a.clip_candidate_id
      join public.clip_candidates c on c.id=a.clip_candidate_id and c.channel_id=a.channel_id
      join private.youtube_owner_authority o on o.channel_id=a.channel_id and o.owner_user_id=a.approved_by
      join public.channels ch on ch.id=o.channel_id and ch.owner_user_id=o.owner_user_id
      where j.id=(policy_->>'publishing_job_id')::uuid and j.channel_id=p_channel_id and j.youtube_video_id=p_resource_id
        and ((j.state='uploaded_private' and j.scheduled_for is null)
          or (p_historical and j.state in ('scheduled','published') and j.scheduled_for=publish_at_))
        and a.id=upload_.id and a.approved_by=owner_ and a.action='upload_private'
        and a.confirmation_text='I approve this exact YouTube upload'
        and a.approved_at is not null and a.consumed_at is not null and a.revoked_at is null
        and c.score>=80 and c.render_status='ready' and nullif(btrim(c.render_uri),'') is not null
        and c.approval_state<>'rejected' and nullif(c.render_error_message,'') is null
        and c.end_ms>c.start_ms and c.end_ms-c.start_ms<=180000
        and (policy_->>'media_sha256') ~ '^[a-f0-9]{64}$'
        and a.package->>'media_sha256'=policy_->>'media_sha256'
        and a.package=private.youtube_upload_package(c.id,policy_->>'media_sha256')
        and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe')
    then return false; end if;

  -- Reuse the existing closed provider snippet/status validation. This
  -- synthesized metadata package establishes no consent and performs no write.
  structural_:=p_package||jsonb_build_object('action','public_video_metadata',
    'before',jsonb_build_object('owned_channel_id',before_->'owned_channel_id','snippet',snippet_,
      'status',status_||'{"privacyStatus":"public"}'::jsonb),
    'after',jsonb_build_object('api','videos','part','snippet','body',jsonb_build_object('id',p_resource_id,'snippet',snippet_)),
    'policy',jsonb_build_object('kind','existing_public_metadata'));
  if not private.youtube_owner_change_package_valid(p_channel_id,'public_video_metadata',p_resource_id,structural_) then return false; end if;
  -- Exactly the same provider-owned tag multiset allowance as private release:
  -- preserve case, duplicate count, all copy and all other metadata values.
  return coalesce((snippet_-'defaultLanguage'-'defaultAudioLanguage'-'tags')
       =((upload_.package->'metadata'->'snippet')-'tags')
    and (select coalesce(jsonb_agg(tag order by tag collate "C"),'[]'::jsonb)
      from jsonb_array_elements_text(coalesce(snippet_->'tags','[]'::jsonb)) t(tag))
       =(select coalesce(jsonb_agg(tag order by tag collate "C"),'[]'::jsonb)
      from jsonb_array_elements_text(upload_.package->'metadata'->'snippet'->'tags') t(tag))
    and status_->'selfDeclaredMadeForKids'=upload_.package->'metadata'->'status'->'selfDeclaredMadeForKids',false);
exception when others then return false;
end $function$;

CREATE OR REPLACE FUNCTION public.approve_clip(p_clip_id uuid, p_action text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(clip_id uuid, publishing_job_id uuid, approval_state text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_channel uuid;
  v_pub uuid;
  v_state text;
  v_score integer;
begin
  if p_action not in ('approve','reject') then
    raise exception 'invalid approval action';
  end if;

  select channel_id, score
    into v_channel, v_score
  from public.clip_candidates
  where id = p_clip_id;

  if v_channel is null then
    raise exception 'clip not found';
  end if;

  if not exists(
    select 1
    from public.channels c
    where c.id = v_channel
      and c.owner_user_id = (select auth.uid())
  ) then
    raise exception 'not authorized';
  end if;

  if p_action = 'approve' then
    if coalesce(v_score, 0) < 80 then
      raise exception 'clip score % is below the required 80-point quality threshold', coalesce(v_score, 0);
    end if;

    update public.clip_candidates
    set approval_state = 'approved',
        approved_at = now(),
        rejected_at = null,
        reviewer_notes = p_notes,
        updated_at = now()
    where id = p_clip_id;

    insert into public.approval_events(channel_id, clip_candidate_id, user_id, action, details)
    values(v_channel, p_clip_id, (select auth.uid()), 'approve', jsonb_build_object('notes', p_notes, 'minimum_score', 80));

    select id into v_pub
    from public.publishing_jobs
    where clip_candidate_id = p_clip_id
      and state not in ('failed_terminal','published')
    limit 1;

    if v_pub is null then
      insert into public.publishing_jobs(channel_id, clip_candidate_id, state)
      values(v_channel, p_clip_id, 'pending')
      returning id into v_pub;
    end if;

    v_state := 'approved';
  else
    update public.clip_candidates
    set approval_state = 'rejected',
        rejected_at = now(),
        approved_at = null,
        reviewer_notes = p_notes,
        updated_at = now()
    where id = p_clip_id;

    insert into public.approval_events(channel_id, clip_candidate_id, user_id, action, details)
    values(v_channel, p_clip_id, (select auth.uid()), 'reject', jsonb_build_object('notes', p_notes));

    v_state := 'rejected';
  end if;

  return query select p_clip_id, v_pub, v_state;
end
$function$;

CREATE OR REPLACE FUNCTION public.claim_clip_render(p_worker_id text, p_clip_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare selected public.clip_render_jobs; c public.clip_candidates; v public.video_sources;
begin
  if p_worker_id is null or length(btrim(p_worker_id)) not between 1 and 120 then raise exception 'invalid worker identity';end if;
  if p_clip_id is null then return null;end if;
  select r.* into selected from public.clip_render_jobs r
    join public.clip_candidates x on x.id=r.clip_candidate_id and x.channel_id=r.channel_id
    join public.video_sources s on s.id=x.video_source_id and s.channel_id=x.channel_id
    join public.channels ch on ch.id=x.channel_id
    where x.id=p_clip_id and ch.owner_user_id=(select auth.uid())
      and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe'
      and (r.state='queued' or(r.state='rendering' and r.lease_until<=now()))
      and x.render_status in('pending','rendering') and x.approval_state<>'rejected' and x.score>=80
      and nullif(btrim(x.preview_uri),'') is null and nullif(btrim(x.render_uri),'') is null
      and x.start_ms>=0 and x.end_ms>x.start_ms and s.duration_seconds>0 and x.end_ms<=s.duration_seconds::bigint*1000
      and not exists(select 1 from public.publishing_jobs p where p.clip_candidate_id=x.id and nullif(btrim(p.youtube_video_id),'') is not null)
    order by r.created_at for update of r,x,s skip locked limit 1;
  if not found then return null;end if;
  update public.clip_render_jobs set state='rendering',lease_token=gen_random_uuid(),lease_until=now()+interval '30 minutes',
    worker_id=p_worker_id,attempts=attempts+1,updated_at=now(),error_message=null
    where clip_candidate_id=selected.clip_candidate_id returning * into selected;
  update public.clip_candidates set render_status='rendering',render_error_message=null,updated_at=now()
    where id=selected.clip_candidate_id returning * into c;
  select * into v from public.video_sources where id=c.video_source_id and channel_id=c.channel_id;
  return to_jsonb(c)||jsonb_build_object('clip_id',c.id,'job_id',c.processing_job_id,'lease_token',selected.lease_token,
    'youtube_video_id',v.youtube_video_id,'source_uri',v.source_uri,'game_topic',v.game_topic,'source_title',v.title,
    'source_duration_seconds',v.duration_seconds);
end $function$;

CREATE OR REPLACE FUNCTION public.enqueue_clip_render()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
 if NEW.score>=80 and NEW.approval_state<>'rejected' and coalesce(NEW.preview_uri,NEW.render_uri) is null then
 insert into public.clip_render_jobs(clip_candidate_id,channel_id) values(NEW.id,NEW.channel_id) on conflict(clip_candidate_id)do nothing;end if;return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.validate_youtube_private_short_provenance(p_channel_id uuid, p_job_id uuid, p_upload_approval_id uuid, p_owner_id uuid, p_video_id text, p_media_sha256 text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select exists(select 1 from public.youtube_upload_approvals a
    join public.publishing_jobs j on j.id=a.publishing_job_id and j.channel_id=a.channel_id and j.clip_candidate_id=a.clip_candidate_id
    join public.clip_candidates c on c.id=a.clip_candidate_id and c.channel_id=a.channel_id
    join private.youtube_owner_authority o on o.channel_id=a.channel_id and o.owner_user_id=a.approved_by
    join public.channels ch on ch.id=o.channel_id and ch.owner_user_id=o.owner_user_id
    where j.id=p_job_id and j.channel_id=p_channel_id and j.youtube_video_id=p_video_id
      and p_video_id ~ '^[A-Za-z0-9_-]{11}$' and j.state in ('uploaded_private','published') and j.scheduled_for is null
      and a.id=p_upload_approval_id and a.approved_by=p_owner_id and a.action='upload_private'
      and a.confirmation_text='I approve this exact YouTube upload'
      and a.approved_at is not null and a.consumed_at is not null and a.revoked_at is null
      and c.score>=80 and c.render_status='ready' and nullif(c.render_uri,'') is not null
      and c.approval_state<>'rejected' and nullif(c.render_error_message,'') is null
      and c.end_ms>c.start_ms and c.end_ms-c.start_ms<=180000
      and p_media_sha256 ~ '^[a-f0-9]{64}$' and a.package->>'media_sha256'=p_media_sha256
      and a.package=private.youtube_upload_package(c.id,p_media_sha256)
      and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe');
$function$;

CREATE OR REPLACE FUNCTION public.validate_youtube_upload_approval(p_job_id uuid, p_approval_id uuid, p_package jsonb)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select exists(select 1 from public.youtube_upload_approvals a
  join public.publishing_jobs j on j.id=a.publishing_job_id and j.channel_id=a.channel_id and j.clip_candidate_id=a.clip_candidate_id
  join public.clip_candidates c on c.id=a.clip_candidate_id and c.channel_id=a.channel_id
  join private.youtube_owner_authority o on o.channel_id=a.channel_id and o.owner_user_id=a.approved_by
  join public.channels ch on ch.id=o.channel_id and ch.owner_user_id=o.owner_user_id
  where j.id=p_job_id and a.id=p_approval_id and a.action='upload_private'
   and a.confirmation_text='I approve this exact YouTube upload' and a.approved_at is not null
   and a.revoked_at is null and a.consumed_at is null and j.youtube_video_id is null and j.state='pending'
   and c.score>=80 and c.render_status='ready' and c.render_uri is not null
   and a.package=p_package and a.package=private.youtube_upload_package(c.id,a.package->>'media_sha256')
   and a.package->>'media_sha256' ~ '^[a-f0-9]{64}$'
   and ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe');
$function$;

CREATE OR REPLACE FUNCTION public.worker_claim_clip_render_v2(p_worker_id text, p_available_source_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare selected public.clip_render_jobs; c public.clip_candidates; v public.video_sources; source_ jsonb;
begin
  if p_worker_id is null or length(btrim(p_worker_id)) not between 1 and 120 then raise exception 'invalid worker identity'; end if;
  if p_available_source_ids is not null then
    if cardinality(p_available_source_ids)>20 or array_ndims(p_available_source_ids)>1
      or exists(select 1 from unnest(p_available_source_ids) s where s is null)
      or (select count(distinct s) from unnest(p_available_source_ids) s)<>cardinality(p_available_source_ids)
      then raise exception 'invalid source manifest IDs'; end if;
    if cardinality(p_available_source_ids)=0 then return null; end if;
  end if;
  select r.* into selected from public.clip_render_jobs r
    join public.clip_candidates x on x.id=r.clip_candidate_id and x.channel_id=r.channel_id
    join public.video_sources s on s.id=x.video_source_id and s.channel_id=x.channel_id
    join private.youtube_owner_authority o on o.channel_id=x.channel_id
    join public.channels ch on ch.id=o.channel_id and ch.owner_user_id=o.owner_user_id
    where ch.youtube_channel_id='UCjWR1CZVFkrVk3S-TRrOGGQ' and ch.youtube_handle='@Hynoe'
      and exists(select 1 from storage.buckets b where b.id='clip-previews' and not b.public)
      and (r.state='queued' or (r.state='rendering' and r.lease_until<=now()))
      and x.render_status in ('pending','rendering') and x.approval_state<>'rejected' and x.score>=80
      and nullif(x.preview_uri,'') is null and nullif(x.render_uri,'') is null
      and x.start_ms>=0 and x.end_ms>x.start_ms and s.duration_seconds>0
      and x.end_ms<=s.duration_seconds::bigint*1000
      and not exists(select 1 from public.publishing_jobs pj where pj.clip_candidate_id=x.id and pj.youtube_video_id is not null)
      and case when p_available_source_ids is null
        then private.clip_render_storage_source(s.channel_id,s.id,s.source_uri) is not null
        else s.id=any(p_available_source_ids) end
    order by x.score desc,r.created_at
    for update of r,x,s skip locked limit 1;
  if not found then return null; end if;
  select * into c from public.clip_candidates where id=selected.clip_candidate_id;
  select * into v from public.video_sources where id=c.video_source_id;
  source_:=case when p_available_source_ids is null
    then private.clip_render_storage_source(v.channel_id,v.id,v.source_uri)
    else jsonb_build_object('kind','local_manifest','video_source_id',v.id) end;
  if source_ is null then return null; end if;
  update public.clip_render_jobs set state='rendering',lease_token=gen_random_uuid(),lease_until=now()+interval '30 minutes',
    worker_id=p_worker_id,attempts=attempts+1,updated_at=now(),error_message=null
    where clip_candidate_id=selected.clip_candidate_id returning * into selected;
  update public.clip_candidates set render_status='rendering',render_error_message=null,updated_at=now()
    where id=c.id returning * into c;
  return to_jsonb(c)||jsonb_build_object('clip_id',c.id,'lease_token',selected.lease_token,'youtube_video_id',v.youtube_video_id,
    'source_duration_seconds',v.duration_seconds,'game_topic',v.game_topic,'source_title',v.title,'source',source_);
end $function$;
