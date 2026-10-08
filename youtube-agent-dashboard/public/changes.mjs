import {createClient} from '/vendor/supabase.mjs';
import {CHANGE_CHANNEL, CHANGE_CONFIRMATION, COPY_LAYOUT_CONFIRMATION, approvedCopyLayoutPlan, runApprovedCopyLayout, prepareExactChange, recordExactChange, applyExactChange, inspectExactChange, verifyReviewHold} from '/owner-change.mjs';
import {PUBLIC_CHANGE_DRAFTS, HOME_DRAFTS} from '/change-drafts.mjs';

const {supabaseUrl, supabaseAnonKey} = window.__HYNOE_YOUTUBE_AGENT_CONFIG__ || {};
const client = createClient(supabaseUrl, supabaseAnonKey);
const $ = id => document.getElementById(id);
const rows = new Map();
let session = null, ownerId = null, ownerVerified = false, busy = false, generation = 0;
let weeklyLoaded = false, activeTab = 'weekly';
let packageRunning = false, packageStop = false;
$('packageConsentLabel').textContent = COPY_LAYOUT_CONFIRMATION;
$('packageTargets').textContent = JSON.stringify([...PUBLIC_CHANGE_DRAFTS.channel, ...HOME_DRAFTS, ...PUBLIC_CHANGE_DRAFTS.videos, ...PUBLIC_CHANGE_DRAFTS.playlists].map(({action, resource_id, target}) => ({action, resource_id, target})), null, 2);

function node(tag, value = '') {
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}
function notice(value) { $('notice').textContent = value; }
function controls() {
  $('signOut').disabled = busy;
  $('loginButton').disabled = busy;
  $('refreshWeekly').disabled = busy || !ownerVerified;
  $('verifyHold').disabled = busy || !ownerVerified;
  $('inspectSaved').disabled = busy || !ownerVerified;
  $('packageConsent').disabled = busy || !ownerVerified;
  $('applyPackage').disabled = busy || !ownerVerified || !$('packageConsent').checked;
  $('pausePackage').classList.toggle('hidden', !packageRunning);
  $('pausePackage').disabled = !packageRunning || packageStop;
  for (const button of document.querySelectorAll('[data-tab]')) button.disabled = busy || !ownerVerified;
  for (const row of rows.values()) {
    const allowed = ownerVerified && !busy && row.state !== 'applied';
    row.prepare.disabled = !allowed;
    row.consent.disabled = !allowed || !row.request || !!row.approvalId;
    row.approve.disabled = !allowed || !row.request || !row.consent.checked || !!row.approvalId;
    row.apply.disabled = !allowed || !row.request || !row.approvalId || row.applyUncertain;
  }
}
function reset() {
  generation++;
  ownerVerified = false;
  busy = false;
  weeklyLoaded = false;
  packageStop = true;
  packageRunning = false;
  $('packageConsent').checked = false;
  $('packageProgress').textContent = '0 / 78 checked. The package runs only after you check consent and click Apply.';
  for (const row of rows.values()) {
    row.consent.checked = false;
    row.request = null;
    row.approvalId = null;
  }
  rows.clear();
  $('weeklyItems').replaceChildren();
  $('channelItems').replaceChildren();
  $('draftItems').replaceChildren();
  $('filter').value = '';
  $('draftCount').textContent = '';
  $('holdStatus').textContent = '';
  $('reviewPanel').classList.add('hidden');
  controls();
}
$('verifyHold').addEventListener('click',async()=>{
 if(busy||!ownerVerified)return;const ticket=generation;busy=true;controls();
 try{await assertSession(ticket);await verifyReviewHold(client);if(ticket===generation)$('holdStatus').textContent='Verified: the server rejects requests without exact recorded approval.';}
 catch(error){if(ticket===generation)$('holdStatus').textContent=error.message;}
 finally{if(ticket===generation){busy=false;controls();}}
});
$('inspectSaved').addEventListener('click',async()=>{
 if(busy||!ownerVerified)return;const ticket=generation;busy=true;controls();
 try{
  await assertSession(ticket);
  const {data:requests,error}=await client.from('youtube_owner_change_requests').select('id,package,resource_id').eq('channel_id',CHANGE_CHANNEL).eq('state','write_uncertain');
  if(error)throw error;let checked=0;
  for(const request of requests||[]){
   await assertSession(ticket);
   const {data:approval,error:approvalError}=await client.from('youtube_owner_change_approvals').select('id,approved_by,consumed_at,revoked_at').eq('request_id',request.id).eq('approved_by',ownerId).maybeSingle();
   if(approvalError)throw approvalError;
   if(!approval?.consumed_at||approval.revoked_at)throw Error('Consumed exact owner approval is required for saved-result inspection.');
   await inspectExactChange(client,request,approval.id);checked++;
  }
  if(ticket===generation)notice(`${checked} saved change(s) verified using read-only YouTube checks. No public writes were repeated.`);
 }catch(error){if(ticket===generation)notice('Saved-result inspection: '+error.message);}
 finally{if(ticket===generation){busy=false;controls();}}
});
async function runCopyLayout() {
  if (busy || !ownerVerified || !$('packageConsent').checked) return;
  const ticket = generation;
  const plan = approvedCopyLayoutPlan(PUBLIC_CHANGE_DRAFTS, HOME_DRAFTS);
  busy = true;
  packageRunning = true;
  packageStop = false;
  controls();
  notice('Running the approved exact copy and Home layout package, one item at a time.');
  try {
    const result = await runApprovedCopyLayout(client, plan, {
      ownerId,
      confirmation: COPY_LAYOUT_CONFIRMATION,
      assertSession: () => assertSession(ticket),
      shouldPause: () => packageStop,
      onProgress: event => {
        if (ticket !== generation) return;
        const row = rows.get(event.proposal?.key);
        if (row && event.request) {
          row.request = event.request;
          if (event.phase === 'prepared') showPackage(row);
          if (event.approvalId) row.approvalId = event.approvalId;
          if (['applied', 'resumed', 'unchanged'].includes(event.phase)) row.state = 'applied';
          row.status.textContent = event.phase === 'unchanged' ? 'Already matches approved target · no YouTube write' : event.phase + ' · exact package ' + event.request.id;
        }
        $('packageProgress').textContent = event.completed + ' / ' + event.total + ' checked · ' + event.applied + ' applied · ' + event.unchanged + ' unchanged · ' + event.resumed + ' receipts verified' + (event.proposal ? ' · ' + event.phase + ': ' + event.proposal.title : '');
      }
    });
    if (ticket !== generation) return;
    notice(result.paused ? 'Paused before the next item. Click Apply to resume using recorded receipts and read-only verification.' : 'All ' + result.completed + ' approved targets checked: ' + result.applied + ' applied, ' + result.unchanged + ' already matched, ' + result.resumed + ' existing receipts verified.');
    if (!result.paused) $('packageConsent').checked = false;
  } catch (error) {
    if (ticket === generation) {
      $('packageConsent').checked = false;
      notice('Package stopped: ' + (error?.message || String(error)));
    }
  } finally {
    if (ticket === generation) { busy = false; packageRunning = false; controls(); }
  }
}
$('packageConsent').addEventListener('change', controls);
$('applyPackage').addEventListener('click', () => void runCopyLayout());
$('pausePackage').addEventListener('click', () => { packageStop = true; controls(); notice('Pausing before the next item after the current exact request finishes.'); });
async function assertSession(ticket) {
  const {data, error} = await client.auth.getSession();
  if (error || !data?.session || data.session.user.id !== ownerId || ticket !== generation || !ownerVerified) {
    throw Error('Session changed. Sign in with the original owner account before continuing.');
  }
}
function showPackage(row) {
  row.consent.checked = false;
  row.approvalId = null;
  row.packageText.textContent = JSON.stringify(row.request.package, null, 2);
  row.packageReview.open = true;
  row.packageReview.classList.remove('hidden');
  row.consentPanel.classList.remove('hidden');
  row.status.textContent = 'Exact live package prepared · awaiting_review · approval not recorded';
  const title = row.request.package.before?.snippet?.title;
  if (row.proposal.action === 'restore_week_upload_visibility' && typeof title === 'string') {
    row.heading.textContent = title;
  }
}
function setRowError(row, message) {
  row.status.textContent = message;
  row.status.classList.add('card-error');
}
async function operate(row, operation) {
  if (busy || !ownerVerified || row.state === 'applied') return;
  const ticket = generation;
  busy = true;
  row.status.classList.remove('card-error');
  controls();
  try {
    await assertSession(ticket);
    if (operation === 'prepare') {
      row.request = null;
      row.approvalId = null;
      row.consent.checked = false;
      row.applyUncertain = false;
      row.packageReview.classList.add('hidden');
      row.consentPanel.classList.add('hidden');
      row.status.textContent = 'Reading the current YouTube state and preparing exact review…';
      notice('Preparing one exact change. Review and approval are separate steps.');
      const {action, resource_id, target} = row.proposal;
      const request = await prepareExactChange(client, {action, resource_id, ...(target ? {target} : {})});
      if (ticket !== generation) return;
      row.request = request;
      row.state = request.state;
      showPackage(row);
      notice('Exact change prepared. Read the complete live package before recording owner approval.');
    } else if (operation === 'approve') {
      if (!row.request || row.approvalId) throw Error('Prepare a fresh exact package before recording approval.');
      if (!row.consent.checked) throw Error('Review the complete package and check the exact consent box before recording approval.');
      await assertSession(ticket);
      const approvalId = await recordExactChange(client, row.request, CHANGE_CONFIRMATION);
      if (ticket !== generation) return;
      row.approvalId = approvalId;
      row.status.textContent = 'Exact owner approval recorded · ' + approvalId + ' · not applied';
      notice('Exact approval recorded for this package. Apply approved change is a separate action.');
    } else if (operation === 'apply') {
      if (!row.request || !row.approvalId || row.applyUncertain) throw Error('Exact recorded approval is required before applying.');
      row.status.textContent = 'Applying the recorded exact change and verifying YouTube readback…';
      notice('Applying one recorded change. Keep this tab open for the verification result.');
      row.applyUncertain = true;
      const result = await applyExactChange(client, row.request, row.approvalId);
      if (ticket !== generation) return;
      row.state = result.state;
      row.status.textContent = 'Applied · verified on YouTube · exact owner approval ' + row.approvalId;
      notice('One exact change applied and verified on YouTube.');
    }
  } catch (error) {
    if (ticket !== generation) return;
    const message = error?.message || String(error);
    setRowError(row, (row.applyUncertain ? 'Save needs review; do not retry blindly. ' : '') + message);
    notice(message);
  } finally {
    if (ticket === generation) {
      busy = false;
      controls();
    }
  }
}
function renderCard(proposal, container, group) {
  const card = document.createElement('article');
  const status = node('div', 'Draft · awaiting_review · approval not recorded');
  status.className = 'item-status';
  const heading = node('h2', proposal.title || proposal.resource_id);
  const resource = node('p', proposal.action + ' · ' + proposal.resource_id);
  resource.className = 'resource';
  const note = node('p', proposal.note || '');
  note.className = 'note';
  card.append(status, heading, resource, note);
  if (proposal.target) {
    const preview = document.createElement('details');
    preview.append(node('summary', 'Review proposed copy / layout'));
    const columns = node('div');
    columns.className = 'drafts-grid';
    const current = node('section');
    current.append(node('h3', 'Audit snapshot — prepare for current live state'), node('pre', proposal.before ? JSON.stringify(proposal.before, null, 2) : 'Current section will be read when you prepare this card.'));
    const proposed = node('section');
    proposed.append(node('h3', 'Proposed change'), node('pre', JSON.stringify(proposal.target, null, 2)));
    columns.append(current, proposed);
    preview.append(columns);
    card.append(preview);
  }
  const packageReview = document.createElement('details');
  packageReview.className = 'hidden';
  const packageText = node('pre');
  packageText.className = 'package';
  packageReview.append(node('summary', 'Complete exact package · live before / proposed after'), packageText);
  const consentPanel = node('div');
  consentPanel.className = 'consent-panel hidden';
  const consentId = 'exact-consent-' + rows.size;
  const consent = node('input');
  consent.type = 'checkbox';
  consent.id = consentId;
  consent.checked = false;
  const consentLabel = node('label', CHANGE_CONFIRMATION);
  consentLabel.htmlFor = consentId;
  const consentLine = node('div');
  consentLine.className = 'consent-line';
  consentLine.append(consent, consentLabel);
  consentPanel.append(node('p', 'Read the complete live before/after package above, then choose your exact consent.'), consentLine);
  const actions = node('div');
  actions.className = 'actions';
  const prepare = node('button', 'Prepare exact change');
  const approve = node('button', 'Record exact approval');
  const apply = node('button', 'Apply approved change');
  approve.className = 'secondary';
  apply.className = 'secondary';
  for (const button of [prepare, approve, apply]) button.type = 'button';
  actions.append(prepare, approve, apply);
  card.append(packageReview, consentPanel, actions);
  container.append(card);
  const row = {proposal, card, status, heading, packageReview, packageText, consentPanel, consent, consentLabel, prepare, approve, apply, group, request: null, approvalId: null, state: 'awaiting_review', applyUncertain: false};
  rows.set(proposal.key, row);
  consent.addEventListener('change', controls);
  prepare.addEventListener('click', () => void operate(row, 'prepare'));
  approve.addEventListener('click', () => void operate(row, 'approve'));
  apply.addEventListener('click', () => void operate(row, 'apply'));
  return row;
}
function renderStaticDrafts() {
  for (const proposal of [...PUBLIC_CHANGE_DRAFTS.channel, ...HOME_DRAFTS]) renderCard(proposal, $('channelItems'), 'channel');
  for (const proposal of [...PUBLIC_CHANGE_DRAFTS.videos, ...PUBLIC_CHANGE_DRAFTS.playlists]) renderCard(proposal, $('draftItems'), 'drafts');
  filterDrafts();
  controls();
}
function filterDrafts() {
  const term = $('filter').value.trim().toLocaleLowerCase();
  let shown = 0, total = 0;
  for (const row of rows.values()) {
    if (row.group !== 'drafts') continue;
    total++;
    const value = [row.proposal.title, row.proposal.topic, row.proposal.resource_id, row.proposal.target?.description].join(' ').toLocaleLowerCase();
    const matches = !term || value.includes(term);
    row.card.classList.toggle('hidden', !matches);
    if (matches) shown++;
  }
  $('draftCount').textContent = shown + ' / ' + total + ' public proposals';
}
async function loadWeekly() {
  if (busy || !ownerVerified) return;
  const ticket = generation;
  busy = true;
  controls();
  notice('Reading this week’s existing uploaded Shorts…');
  try {
    await assertSession(ticket);
    const {data, error} = await client.from('publishing_jobs')
      .select('youtube_video_id,clip_candidate_id,created_at')
      .eq('channel_id', CHANGE_CHANNEL)
      .not('youtube_video_id', 'is', null)
      .gte('created_at', '2026-10-05T00:00:00Z')
      .lt('created_at', '2026-10-12T00:00:00Z')
      .order('created_at', {ascending: false});
    if (error) throw error;
    if (ticket !== generation) return;
    for (const [key, row] of rows) if (row.group === 'weekly') rows.delete(key);
    $('weeklyItems').replaceChildren();
    const uploaded = new Map();
    for (const job of data || []) if (job.youtube_video_id && !uploaded.has(job.youtube_video_id)) uploaded.set(job.youtube_video_id, job);
    for (const job of uploaded.values()) {
      renderCard({
        key: 'weekly:' + job.youtube_video_id,
        action: 'restore_week_upload_visibility',
        resource_id: job.youtube_video_id,
        title: 'Uploaded Short · ' + job.youtube_video_id,
        note: 'Uploaded ' + new Date(job.created_at).toLocaleString() + '. Prepare to read the current title and exact visibility change. The server checks this upload’s eligibility.'
      }, $('weeklyItems'), 'weekly');
    }
    weeklyLoaded = true;
    if (!uploaded.size) $('weeklyItems').append(node('p', 'No existing uploads were found in this week’s owner-visible publishing jobs.'));
    notice(uploaded.size + ' existing upload(s) loaded. Each needs its own exact review, approval and separate apply action.');
  } catch (error) {
    if (ticket === generation) notice(error?.message || String(error));
  } finally {
    if (ticket === generation) { busy = false; controls(); }
  }
}
function selectTab(name) {
  activeTab = name;
  for (const button of document.querySelectorAll('[data-tab]')) button.setAttribute('aria-selected', String(button.dataset.tab === name));
  for (const key of ['weekly', 'channel', 'drafts']) $(key + 'Panel').classList.toggle('hidden', key !== name);
  if (name === 'weekly' && !weeklyLoaded) void loadWeekly();
}
async function applySession(next) {
  const nextId = next?.user?.id || null;
  if (nextId === ownerId && !!next === !!session) { session = next; return; }
  reset();
  session = next;
  ownerId = nextId;
  $('loginPanel').classList.toggle('hidden', !!next);
  $('signOut').classList.toggle('hidden', !next);
  $('account').textContent = next?.user?.email || '';
  if (!next) { notice('Sign in with your existing Hynoe Agent owner account.'); return; }
  const ticket = generation;
  busy = true;
  controls();
  notice('Checking original channel owner access…');
  try {
    const {data, error} = await client.rpc('is_original_youtube_change_owner', {p_channel_id: CHANGE_CHANNEL});
    if (error) throw error;
    if (data !== true) throw Error('This account does not have original channel owner approval access.');
    if (ticket !== generation) return;
    ownerVerified = true;
    $('reviewPanel').classList.remove('hidden');
    renderStaticDrafts();
    notice('Owner verified. Select and prepare one exact change to begin.');
  } catch (error) {
    if (ticket === generation) notice(error?.message || String(error));
  } finally {
    if (ticket === generation) { busy = false; controls(); }
  }
  if (ticket === generation && ownerVerified && activeTab === 'weekly') await loadWeekly();
}
$('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  $('loginButton').disabled = true;
  try {
    const {error} = await client.auth.signInWithPassword({email: $('email').value.trim(), password: $('password').value});
    if (error) throw error;
  } catch (error) { notice(error?.message || String(error)); }
  finally { $('password').value = ''; controls(); }
});
$('signOut').addEventListener('click', async () => {
  if (busy) return;
  reset();
  const {error} = await client.auth.signOut();
  if (error) notice(error.message);
});
$('refreshWeekly').addEventListener('click', () => void loadWeekly());
$('filter').addEventListener('input', filterDrafts);
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => selectTab(button.dataset.tab));
client.auth.onAuthStateChange((_event, next) => { setTimeout(() => void applySession(next), 0); });
const {data: initialData, error: initialError} = await client.auth.getSession();
if (initialError) notice(initialError.message);
else await applySession(initialData?.session || null);
controls();

