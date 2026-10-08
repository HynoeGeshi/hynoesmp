import { createClient } from '/vendor/supabase.mjs';
import { loadCandidates, attachPreview, submitApproval, prepareUploadReview, recordExactUploadApproval, reviewQueue, previewPath, publicationStatus, todayReadyCount } from '/dashboard-core.mjs';

const config = window.__HYNOE_YOUTUBE_AGENT_CONFIG__ || {};
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
const authPanel = document.querySelector('#authPanel');
const reviewPanel = document.querySelector('#reviewPanel');
const candidateList = document.querySelector('#candidateList');
const rejectedHistory = document.querySelector('#rejectedHistory');
const rejectedSummary = document.querySelector('#rejectedSummary');
const rejectedList = document.querySelector('#rejectedList');
const postedHistory = document.querySelector('#postedHistory');
const postedSummary = document.querySelector('#postedSummary');
const postedList = document.querySelector('#postedList');
const uploadedHistory = document.querySelector('#uploadedHistory');
const uploadedSummary = document.querySelector('#uploadedSummary');
const uploadedList = document.querySelector('#uploadedList');
const status = document.querySelector('#status');
const loginForm = document.querySelector('#loginForm');
const signOut = document.querySelector('#signOut');
const refreshClips = document.querySelector('#refreshClips');
const dailyReady = document.querySelector('#dailyReady');
let signedIn = false;
let refreshGeneration = 0;

function textEl(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value ?? '';
  return element;
}

function renderState(candidate) {
  if (candidate.render_status === 'failed') {
    if (candidate.render_error_message?.startsWith('Quality hold:')) return candidate.render_error_message;
    return candidate.render_error_message ? `Render failed: ${candidate.render_error_message}` : 'Render failed';
  }
  if (candidate.render_status === 'ready') return 'Rendered and ready to review';
  if (candidate.render_status === 'rendering') return 'Rendering now…';
  if (candidate.render_status === 'pending') return 'Queued for rendering';
  return candidate.render_status || 'Waiting for render';
}

function buildPreview(candidate) {
  const preview = document.createElement('div');
  preview.className = 'preview';
  if (candidate.render_status !== 'ready' && !previewPath(candidate)) {
    preview.append(textEl('div', 'preview-placeholder', renderState(candidate)));
    return preview;
  }

  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  preview.append(video);

  let errorCount = 0;
  const showPreviewError = () => {
    preview.querySelector('.preview-error')?.remove();
    const error = document.createElement('div');
    error.className = 'preview-error';
    error.append(textEl('p', '', 'Rendered, but preview could not be opened'));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry preview';
    retry.addEventListener('click', () => {
      error.remove();
      errorCount = 0;
      void attachPreview(video, supabase, candidate).catch(showPreviewError);
    });
    error.append(retry);
    preview.append(error);
  };
  video.addEventListener('error', () => {
    errorCount += 1;
    if (errorCount > 1) showPreviewError();
  });
  video.addEventListener('hynoe-preview-sign-failed', showPreviewError);
  void attachPreview(video, supabase, candidate).catch(showPreviewError);
  return preview;
}

function buildActions(candidate) {
  const actions = document.createElement('div');
  actions.className = 'actions';
  const publication = publicationStatus(candidate);
  if (publication) {
    actions.append(textEl('span','action-feedback',publication.kind === 'uploaded' ? 'Already uploaded privately. Exact public release approval is separate.' : publication.kind === 'posted' ? 'Posted publicly.' : 'Existing upload needs visibility verification before another review action.'));
    return actions;
  }
  if (candidate.approval_state === 'rejected') return actions;

  const approve = document.createElement('button');
  approve.type = 'button';
  approve.textContent = 'Approve';
  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'reject';
  reject.textContent = 'Reject';
  const feedback = textEl('span', 'action-feedback', '');
  const buttons = [approve, reject];
  const canApprove = candidate.render_status === 'ready' && Boolean(candidate.render_uri) && Number(candidate.score) >= 90;
  let review = null;
  const unlock = () => {approve.disabled = !canApprove;reject.disabled = false;};
  unlock();

  const showExactReview = (package_) => {
    review = document.createElement('section');
    review.className = 'exact-upload-review';
    review.append(textEl('h3', '', 'Exact private YouTube upload'));
    review.append(textEl('p', '', 'Review this video and its exact title, description and private visibility. Confirming records approval for one upload.'));
    const details = document.createElement('details');
    details.open = true;
    details.append(textEl('summary', '', 'Exact upload package'));
    details.append(textEl('pre', '', JSON.stringify(package_, null, 2)));
    review.append(details);
    const consent = document.createElement('input');
    consent.type = 'checkbox';
    consent.checked = false;
    const label = document.createElement('label');
    label.className = 'exact-upload-consent';
    label.append(consent, textEl('span', '', 'I approve this exact YouTube upload'));
    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.textContent = 'Confirm approval';
    confirm.disabled = true;
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'reject';
    cancel.textContent = 'Cancel';
    let recording = false;
    const close = () => {consent.checked = false;confirm.disabled = true;review?.remove();review = null;unlock();};
    consent.addEventListener('change', () => {confirm.disabled = !consent.checked || recording;});
    cancel.addEventListener('click', () => {if (!recording) {close();feedback.textContent = '';}});
    confirm.addEventListener('click', async () => {
      if (!signedIn || !canApprove || !consent.checked || recording) return;
      recording = true;
      confirm.disabled = true;
      cancel.disabled = true;
      feedback.textContent = 'Recording exact approval…';
      try {
        await recordExactUploadApproval(supabase, package_, 'I approve this exact YouTube upload');
        close();
        feedback.textContent = 'Exact private upload consent recorded; no upload performed';
        await refreshCandidates();
      } catch (error) {
        feedback.textContent = error?.message || 'Review action failed';
      } finally {
        recording = false;
        confirm.disabled = !consent.checked;
        cancel.disabled = false;
      }
    });
    review.append(label, confirm, cancel);
    actions.append(review);
  };

  const run = async (action) => {
    if (!signedIn || (action === 'approve' && !canApprove)) return;
    for (const button of buttons) button.disabled = true;
    feedback.textContent = action === 'approve' ? 'Loading exact review…' : 'Rejecting…';
    try {
      if(action === 'approve') {
        const package_ = await prepareUploadReview(supabase,candidate.id);
        if (!signedIn) return;
        showExactReview(package_);
        feedback.textContent = 'Review the exact package below.';
        return;
      } else await submitApproval(supabase, candidate.id, action, null);
      feedback.textContent = action === 'approve' ? 'Exact private upload consent recorded; no upload performed' : 'Rejected';
      await refreshCandidates();
    } catch (error) {
      feedback.textContent = error?.message || 'Review action failed';
    } finally {
      if (!review) unlock();
    }
  };

  approve.addEventListener('click', () => void run('approve'));
  reject.addEventListener('click', () => void run('reject'));
  actions.append(approve, reject, feedback);
  return actions;
}

function renderCandidateCard(candidate) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.clipId = candidate.id;

  const top = document.createElement('div');
  top.className = 'card-top';
  top.append(textEl('span', 'score', `${candidate.score ?? 0}/100`));
  top.append(textEl('span', 'pill', candidate.category || 'uncategorized'));
  card.append(top);
  card.append(textEl('h2', '', candidate.title || 'Untitled Short'));
  card.append(buildActions(candidate));
  card.append(buildPreview(candidate));
  if (candidate.hook) card.append(textEl('p', 'hook', candidate.hook));
  if (candidate.transcript_excerpt) card.append(textEl('p', 'excerpt', candidate.transcript_excerpt));
  card.append(textEl('p', `render-state ${candidate.render_status || 'unknown'}`, publicationStatus(candidate)?.kind === 'uploaded' ? 'Uploaded privately; awaiting exact public release.' : renderState(candidate)));
  card.append(textEl('p', 'approval-state', `Prior review: ${candidate.approval_state || 'pending'}. Exact publication consent is checked separately.`));
  return card;
}

function renderPostedCard(candidate) {
  const card = document.createElement('article');
  card.className = 'card'; card.dataset.clipId = candidate.id;
  card.append(textEl('h2','',candidate.title || 'Untitled Short'));
  const publication = publicationStatus(candidate);
  card.append(textEl('p','approval-state','Posted publicly · ' + publication.youtube_video_id));
  const link = textEl('a','','Watch posted Short');
  link.href = 'https://www.youtube.com/shorts/' + publication.youtube_video_id;
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  card.append(link);
  return card;
}

async function refreshCandidates() {
  if (!signedIn) return;
  const generation = ++refreshGeneration;
  dailyReady.textContent = 'Today: Loading new Shorts…';
  try {
    const candidates = await loadCandidates(supabase);
    if (!signedIn || generation !== refreshGeneration) return;
    dailyReady.textContent = `Today: ${todayReadyCount(candidates)} of 15 new Shorts ready`;
    candidateList.replaceChildren();
    rejectedList.replaceChildren();
    postedList.replaceChildren(); uploadedList.replaceChildren();
    const { active, rejected, posted, uploaded, counts } = reviewQueue(candidates);
    for (const candidate of active) candidateList.append(renderCandidateCard(candidate));
    for (const candidate of rejected) rejectedList.append(renderCandidateCard(candidate));
    for (const candidate of posted) postedList.append(renderPostedCard(candidate));
    for (const candidate of uploaded) uploadedList.append(renderCandidateCard(candidate));
    rejectedSummary.textContent = `Rejected history (${counts.rejected})`;
    postedSummary.textContent = `Posted history (${counts.posted})`;
    uploadedSummary.textContent = `Uploaded privately (${counts.uploaded})`;
    uploadedHistory.classList[counts.uploaded ? 'remove' : 'add']('hidden');
    status.textContent = `${counts.ready} ready to review · ${counts.awaiting} awaiting render · ${counts.approved} approved · ${counts.rejected} rejected`;
    if (counts.attention) status.textContent += ` · ${counts.attention} need attention`;
    if (counts.posted) status.textContent += ` · ${counts.posted} posted`;
    if (counts.uploaded) status.textContent += ` · ${counts.uploaded} uploaded privately`;
  } catch (error) {
    if (signedIn && generation === refreshGeneration) {
      dailyReady.textContent = 'Today: New Shorts count unavailable';
      status.textContent = error?.message || 'Could not load Shorts.';
    }
  }
}

async function applySession(session) {
  signedIn = Boolean(session);
  if (!session) {
    refreshGeneration += 1;
    dailyReady.textContent = 'Today: Sign in to see new Shorts';
    candidateList.replaceChildren();
    rejectedList.replaceChildren();
    postedList.replaceChildren(); uploadedList.replaceChildren();
    postedSummary.textContent = 'Posted history'; uploadedSummary.textContent = 'Uploaded privately';
    postedHistory.open = false; uploadedHistory.open = false;
    rejectedSummary.textContent = 'Rejected history';
    rejectedHistory.open = false;
    authPanel.classList.remove('hidden');
    reviewPanel.classList.add('hidden');
    status.textContent = 'Sign in to review Shorts.';
    return;
  }
  authPanel.classList.add('hidden');
  reviewPanel.classList.remove('hidden');
  status.textContent = 'Signed in. Loading review queue…';
  await refreshCandidates();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  status.textContent = 'Signing in…';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) status.textContent = error.message;
});

signOut.addEventListener('click', () => supabase.auth.signOut());
refreshClips?.addEventListener('click', async () => {
  refreshClips.disabled = true;
  try { await refreshCandidates(); }
  finally { refreshClips.disabled = false; }
});

const { data: { session } } = await supabase.auth.getSession();
await applySession(session);
supabase.auth.onAuthStateChange((_event, nextSession) => {
  void applySession(nextSession);
});
