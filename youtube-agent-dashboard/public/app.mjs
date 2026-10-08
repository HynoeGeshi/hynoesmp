import { createClient } from '/vendor/supabase.mjs';
import { loadCandidates, attachPreview, submitApproval, prepareUploadReview, recordExactUploadApproval } from '/dashboard-core.mjs';

const config = window.__HYNOE_YOUTUBE_AGENT_CONFIG__ || {};
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
const authPanel = document.querySelector('#authPanel');
const reviewPanel = document.querySelector('#reviewPanel');
const candidateList = document.querySelector('#candidateList');
const status = document.querySelector('#status');
const loginForm = document.querySelector('#loginForm');
const signOut = document.querySelector('#signOut');

function textEl(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value ?? '';
  return element;
}

function renderState(candidate) {
  if (candidate.render_status === 'failed') {
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
  if (candidate.render_status !== 'ready') {
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
  if (candidate.approval_state === 'rejected') return actions;

  const approve = document.createElement('button');
  approve.type = 'button';
  approve.textContent = 'Review exact private upload';
  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'reject';
  reject.textContent = 'Reject';
  const feedback = textEl('span', 'action-feedback', '');
  const buttons = [approve, reject];

  const run = async (action) => {
    for (const button of buttons) button.disabled = true;
    feedback.textContent = action === 'approve' ? 'Approving…' : 'Rejecting…';
    try {
      if(action === 'approve') {
        const package_ = await prepareUploadReview(supabase,candidate.id);
        if(!window.confirm(`Approve this exact private YouTube upload?\n\n${JSON.stringify(package_,null,2)}\n\nThis records consent for one upload of these exact bytes and metadata.`)) return;
        await recordExactUploadApproval(supabase,package_,'I approve this exact YouTube upload');
      } else await submitApproval(supabase, candidate.id, action, null);
      feedback.textContent = action === 'approve' ? 'Exact private upload consent recorded; no upload performed' : 'Rejected';
      await refreshCandidates();
    } catch (error) {
      feedback.textContent = error?.message || 'Review action failed';
    } finally {
      for (const button of buttons) button.disabled = false;
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
  card.append(buildPreview(candidate));
  if (candidate.hook) card.append(textEl('p', 'hook', candidate.hook));
  if (candidate.transcript_excerpt) card.append(textEl('p', 'excerpt', candidate.transcript_excerpt));
  card.append(textEl('p', `render-state ${candidate.render_status || 'unknown'}`, renderState(candidate)));
  card.append(textEl('p', 'approval-state', `Prior review: ${candidate.approval_state || 'pending'}. Exact publication consent is checked separately.`));
  card.append(buildActions(candidate));
  return card;
}

async function refreshCandidates() {
  candidateList.replaceChildren();
  try {
    const candidates = await loadCandidates(supabase);
    for (const candidate of candidates) candidateList.append(renderCandidateCard(candidate));
    status.textContent = candidates.length ? `${candidates.length} Shorts in queue` : 'No Shorts waiting right now.';
  } catch (error) {
    status.textContent = error?.message || 'Could not load Shorts.';
  }
}

async function applySession(session) {
  if (!session) {
    candidateList.replaceChildren();
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

const { data: { session } } = await supabase.auth.getSession();
await applySession(session);
supabase.auth.onAuthStateChange((_event, nextSession) => {
  void applySession(nextSession);
});
