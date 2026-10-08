import { uploadPackage } from './upload-package.mjs';
const BUCKET_ORDER = { review: 0, ready: 1, processing: 2, terminal: 3 };
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function uploadedJobs(candidate) {
  return (Array.isArray(candidate?.publishing_jobs) ? candidate.publishing_jobs : []).filter(job =>
    candidate.id && candidate.channel_id && job.clip_candidate_id === candidate.id && job.channel_id === candidate.channel_id && YOUTUBE_ID.test(job.youtube_video_id ?? ''));
}

export function publicationStatus(candidate) {
  const jobs = uploadedJobs(candidate);
  for (const job of jobs) {
    const catalog = (candidate.publication_catalog ?? []).find(row => row.channel_id === candidate.channel_id && row.video_id === job.youtube_video_id);
    if (catalog?.privacy === 'public' || (!catalog && job.state === 'published' && Number.isFinite(Date.parse(job.published_at)))) {
      return {kind:'posted',youtube_video_id:job.youtube_video_id,job_id:job.id};
    }
  }
  const privateJob = jobs.find(job => job.state === 'uploaded_private');
  if (privateJob) return {kind:'uploaded',youtube_video_id:privateJob.youtube_video_id,job_id:privateJob.id};
  if (jobs.length) return {kind:'unverified',youtube_video_id:jobs[0].youtube_video_id,job_id:jobs[0].id};
  return null;
}

export function reviewQueue(candidates = []) {
  const active = [];
  const rejected = [];
  const posted = [], uploaded = [];
  const counts = { ready: 0, awaiting: 0, approved: 0, rejected: 0, attention: 0, posted: 0, uploaded: 0 };
  for (const candidate of candidates) {
    const publication = publicationStatus(candidate);
    if (publication?.kind === 'posted') {posted.push(candidate); counts.posted += 1; continue;}
    if (publication?.kind === 'uploaded') {uploaded.push(candidate); counts.uploaded += 1; continue;}
    if (candidate.approval_state === 'rejected') {
      rejected.push(candidate);
      counts.rejected += 1;
      continue;
    }
    active.push(candidate);
    if (publication?.kind === 'unverified') {counts.attention += 1; continue;}
    if (candidate.approval_state === 'approved') counts.approved += 1;
    if (candidate.approval_state === 'pending') {
      if (candidate.render_status === 'ready' && previewPath(candidate)) counts.ready += 1;
      else if (candidate.render_status === 'pending' || candidate.render_status === 'rendering') counts.awaiting += 1;
      else counts.attention += 1;
    }
  }
  return { active, rejected, posted, uploaded, counts };
}

export function candidateBucket(candidate) {
  if (candidate?.approval_state === 'rejected' || candidate?.render_status === 'failed') return 'terminal';
  if (candidate?.render_status === 'ready' && (candidate?.approval_state ?? 'pending') === 'pending') return 'review';
  if (candidate?.render_status === 'ready') return 'ready';
  return 'processing';
}

export function sortCandidates(candidates = []) {
  return [...candidates].sort((a, b) => {
    const bucket = BUCKET_ORDER[candidateBucket(a)] - BUCKET_ORDER[candidateBucket(b)];
    if (bucket) return bucket;
    const score = Number(b?.score ?? 0) - Number(a?.score ?? 0);
    if (score) return score;
    return new Date(b?.created_at ?? 0).getTime() - new Date(a?.created_at ?? 0).getTime();
  });
}

export async function loadCandidates(supabase) {
  const fields = [
    'id','channel_id','video_source_id','start_ms','end_ms','category','score','transcript_excerpt','hook','title','description','hashtags',
    'render_uri','preview_uri','render_status','approval_state','reviewer_notes','created_at','updated_at','render_error_message',
    'publishing_jobs(id,channel_id,clip_candidate_id,state,youtube_video_id,published_at)'
  ].join(',');
  const { data, error } = await supabase.from('clip_candidates').select(fields);
  if (error) throw error;
  const candidates = data ?? [];
  const jobs = candidates.flatMap(uploadedJobs);
  if (!jobs.length) return sortCandidates(candidates);
  // Match only actual Short upload IDs from jobs. Source video IDs and generic
  // approval flags are never evidence of publication. These are owner/RLS reads.
  const {data: catalog, error: catalogError} = await supabase.from('revival_catalog').select('channel_id,video_id,privacy')
    .in('channel_id',[...new Set(jobs.map(job => job.channel_id))])
    .in('video_id',[...new Set(jobs.map(job => job.youtube_video_id))]);
  if (catalogError) throw catalogError;
  return sortCandidates(candidates.map(candidate => ({...candidate, publication_catalog:(catalog ?? []).filter(row => row.channel_id === candidate.channel_id)})));
}

export function previewPath(candidate) {
  if (!['ready','failed'].includes(candidate?.render_status)) return null;
  return candidate?.preview_uri || candidate?.render_uri || null;
}

export async function signPreview(supabase, candidate) {
  if (!['ready','failed'].includes(candidate?.render_status)) return null;
  const path = previewPath(candidate);
  if (!path) {
    if (candidate.render_status === 'failed') return null;
    const error = new Error('Rendered clip has no preview path');
    error.code = 'preview_path_missing';
    throw error;
  }
  const { data, error } = await supabase.storage.from('clip-previews').createSignedUrl(path, 600);
  if (error) throw error;
  if (!data?.signedUrl) {
    const missing = new Error('Supabase did not return a signed preview URL');
    missing.code = 'preview_sign_failed';
    throw missing;
  }
  return data.signedUrl;
}

export async function attachPreview(videoElement, supabase, candidate) {
  const initialUrl = await signPreview(supabase, candidate);
  if (!initialUrl) return;
  videoElement.src = initialUrl;
  videoElement.load?.();
  let retried = false;
  videoElement.addEventListener('error', async () => {
    if (retried) return;
    retried = true;
    try {
      const refreshedUrl = await signPreview(supabase, candidate);
      if (refreshedUrl) {
        videoElement.src = refreshedUrl;
        videoElement.load?.();
      }
    } catch {
      videoElement.dispatchEvent?.(new Event('hynoe-preview-sign-failed'));
    }
  });
}

export async function submitApproval(supabase, clipId, action, notes = null) {
  if (action !== 'approve' && action !== 'reject') {
    throw new Error('invalid approval action');
  }
  if (action === 'approve') throw new Error('Exact upload package and owner confirmation required');
  const { data, error } = await supabase.rpc('approve_clip', {
    p_clip_id: clipId,
    p_action: action,
    p_notes: notes,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function prepareUploadReview(supabase, clipId, fetchMedia = fetch) {
  const {data:clip,error} = await supabase.from('clip_candidates').select('*').eq('id',clipId).single();
  if(error) throw error;
  if(clip.render_status !== 'ready' || !clip.render_uri || Number(clip.score)<90) throw new Error('A 90+ score and finished private render are required');
  const {data:signed,error:signError}=await supabase.storage.from('clip-previews').createSignedUrl(clip.render_uri,600);
  if(signError) throw signError;
  const media=await fetchMedia(signed.signedUrl);
  if(!media.ok) throw new Error('Private rendered media could not be read');
  const digest=await crypto.subtle.digest('SHA-256',await media.arrayBuffer());
  return uploadPackage(clip,Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''));
}
export async function recordExactUploadApproval(supabase, package_, confirmation) {
  if(confirmation !== 'I approve this exact YouTube upload') throw new Error('Exact owner confirmation required');
  const {data,error}=await supabase.rpc('approve_clip_upload',{p_clip_id:package_.clip_candidate_id,p_package:package_,p_confirmation_text:confirmation});
  if(error) throw error;
  const recorded=Array.isArray(data)?data[0]:data;
  if(!recorded?.upload_approval_id) throw new Error('Exact approval was not recorded');
  return recorded;
}
