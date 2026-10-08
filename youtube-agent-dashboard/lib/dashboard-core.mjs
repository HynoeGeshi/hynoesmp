const BUCKET_ORDER = { review: 0, ready: 1, processing: 2, terminal: 3 };

export function reviewQueue(candidates = []) {
  const active = [];
  const rejected = [];
  const counts = { ready: 0, awaiting: 0, approved: 0, rejected: 0, attention: 0 };
  for (const candidate of candidates) {
    if (candidate.approval_state === 'rejected') {
      rejected.push(candidate);
      counts.rejected += 1;
      continue;
    }
    active.push(candidate);
    if (candidate.approval_state === 'approved') counts.approved += 1;
    if (candidate.approval_state === 'pending') {
      if (previewPath(candidate)) counts.ready += 1;
      else if (candidate.render_status === 'pending' || candidate.render_status === 'rendering') counts.awaiting += 1;
      else counts.attention += 1;
    }
  }
  return { active, rejected, counts };
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
    'id','start_ms','end_ms','category','score','transcript_excerpt','hook','title','description','hashtags',
    'render_uri','preview_uri','render_status','approval_state','reviewer_notes','created_at','updated_at','render_error_message'
  ].join(',');
  const { data, error } = await supabase.from('clip_candidates').select(fields);
  if (error) throw error;
  return sortCandidates(data ?? []);
}

export function previewPath(candidate) {
  if (candidate?.render_status !== 'ready') return null;
  return candidate?.preview_uri || candidate?.render_uri || null;
}

export async function signPreview(supabase, candidate) {
  if (candidate?.render_status !== 'ready') return null;
  const path = previewPath(candidate);
  if (!path) {
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
  const { data, error } = await supabase.rpc('approve_clip', {
    p_clip_id: clipId,
    p_action: action,
    p_notes: notes,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

