# Hynoe YouTube Agent Render Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new authenticated Hynoe YouTube Agent dashboard on Render that plays existing private rendered Shorts with 10-minute signed Supabase URLs and preserves the existing approval and publishing safeguards.

**Architecture:** Keep `hynoe-shorts-cloud` as a separate Python Render worker. Add a small Node dashboard application under `youtube-agent-dashboard/` that serves static browser code and runtime public Supabase configuration; all owner data, private preview signing, and approval RPCs execute through the logged-in user's Supabase session and existing RLS. Leave the Vercel dashboard unchanged until the Render version is verified.

**Tech Stack:** Node.js ESM, built-in `node:http`, `@supabase/supabase-js` 2.117.2, existing bundled `assets/vendor/supabase.mjs`, Node test runner, Render web service, Supabase Auth/Postgres/Storage.

**Spec:** `docs/superpowers/specs/2026-10-07-youtube-agent-render-migration-design.md`

## Global Constraints

- New dashboard service name: `hynoe-youtube-agent`.
- Render region: Ohio.
- Existing Render worker `hynoe-shorts-cloud` remains a separate process and is not modified except for regression verification.
- Supabase project remains `bgtxfzvzksgvradodafo`.
- `clip-previews` remains private; never add a public storage policy or construct a public object URL.
- Preview signed URL TTL is exactly 600 seconds.
- Browser-visible configuration contains only Supabase project URL and anon/publishable key.
- Never expose service-role credentials, worker/wake tokens, OAuth refresh tokens, or signing secrets to browser code or logs.
- Candidate data and storage access run as the authenticated Supabase user under existing RLS.
- Approval uses `approve_clip(p_clip_id uuid, p_action text, p_notes text)` with actions exactly `approve` or `reject`.
- Existing `approve_clip` ownership and 90-point quality checks are preserved; do not bypass the RPC with direct client updates.
- Publishing remains explicit/private-first; this dashboard migration does not auto-publish publicly.
- Existing Vercel dashboard is not deleted, paused, or changed during this plan.

## Review Focus

- **Expired/broken signed URL:** a ready video that emits a playback error should receive one fresh signed URL instead of becoming permanently unwatchable; Task 3 adds this test.
- **Ready row with no storage path:** show a playback-failure state and do not call Storage with `undefined`; Task 3 adds this test.
- **Unauthenticated/revoked session:** clear all candidate UI and return to the sign-in screen immediately; Task 1 adds this test.
- **Approval double-click/network race:** disable the card actions while the RPC is in flight and allow another action only after completion; Task 4 adds this test.
- **Malformed candidate fields / HTML-like text:** render user/data-derived text with DOM `textContent`, never string-interpolate it into executable HTML; Task 2 adds this test.

---

## File Map

- `youtube-agent-dashboard/server.mjs` — Node HTTP server, health endpoint, safe runtime config, static file serving.
- `youtube-agent-dashboard/public/index.html` — dashboard shell and sign-in/review containers.
- `youtube-agent-dashboard/public/app.mjs` — Supabase client bootstrap, auth lifecycle, DOM orchestration.
- `youtube-agent-dashboard/public/styles.css` — responsive review queue and video-card presentation.
- `youtube-agent-dashboard/lib/dashboard-core.mjs` — pure/testable candidate sorting, preview signing, approval helpers, and status helpers.
- `youtube-agent-dashboard/tests/server.test.mjs` — server/config/security tests.
- `youtube-agent-dashboard/tests/dashboard-core.test.mjs` — candidate, preview, and approval contract tests.
- `youtube-agent-dashboard/tests/app-contract.test.mjs` — static/browser contract tests for auth gate, safe DOM rendering, player wiring, and action locking.
- `youtube-agent-dashboard/README.md` — local commands, required environment variables, Render build/start commands, security notes.
- Existing `assets/vendor/supabase.mjs` — reused browser bundle; no duplicate Supabase dependency or CDN script.
- Existing `youtube-shorts-cloud/tests/test_worker_policy.py` — regression suite only; no implementation change expected.

### Task 1: Dashboard Server and Authentication Gate

**Files:**
- Create: `youtube-agent-dashboard/server.mjs`
- Create: `youtube-agent-dashboard/public/index.html`
- Create: `youtube-agent-dashboard/public/app.mjs`
- Create: `youtube-agent-dashboard/public/styles.css`
- Create: `youtube-agent-dashboard/tests/server.test.mjs`
- Create: `youtube-agent-dashboard/tests/app-contract.test.mjs`
- Create: `youtube-agent-dashboard/README.md`

**Interfaces:**
- Consumes: environment variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and Render `PORT`.
- Produces: `createServer(options) -> http.Server`, `publicConfig(env) -> { supabaseUrl, supabaseAnonKey }`, `GET /health -> { ok: true }`, `GET /config.js -> window.__HYNOE_YOUTUBE_AGENT_CONFIG__`, and browser auth lifecycle driven by `supabase.auth.getSession()` / `onAuthStateChange()`.

- [ ] **Step 1: Write failing server/config tests**

Add tests named `public_config_exposes_only_public_supabase_values`, `server_health_is_200`, `config_response_is_no_store`, and `static_server_does_not_expose_parent_files`. Assert the runtime config has exactly `supabaseUrl` and `supabaseAnonKey`, `/health` returns 200 JSON, `/config.js` carries `Cache-Control: no-store`, and traversal requests cannot read files outside the dashboard public/vendor allowlist.

- [ ] **Step 2: Run server tests and verify RED**

Run: `node --test youtube-agent-dashboard/tests/server.test.mjs`
Expected: FAIL because `server.mjs` and its exports do not exist.

- [ ] **Step 3: Implement the minimal Node server**

In `server.mjs`, implement `publicConfig(env)` and `createServer({ env, publicDir, vendorFile })`. Serve only `/`, `/app.mjs`, `/styles.css`, `/vendor/supabase.mjs`, `/config.js`, and `/health`; use the existing root `assets/vendor/supabase.mjs` for `/vendor/supabase.mjs`. Bind to `0.0.0.0:${PORT}` only in the executable entry path.

- [ ] **Step 4: Run server tests and verify GREEN**

Run: `node --test youtube-agent-dashboard/tests/server.test.mjs`
Expected: PASS.

- [ ] **Step 5: Write failing browser-auth contract tests**

In `app-contract.test.mjs`, assert `app.mjs` imports `createClient` from `/vendor/supabase.mjs`, calls `auth.getSession`, subscribes to `auth.onAuthStateChange`, uses `auth.signInWithPassword` for the login form, supports `auth.signOut`, and clears/hides owner review content when there is no session. Add an assertion that revoked/cleared session state empties the candidate container.

- [ ] **Step 6: Run auth contract tests and verify RED**

Run: `node --test youtube-agent-dashboard/tests/app-contract.test.mjs`
Expected: FAIL until the browser bootstrap and shell are implemented.

- [ ] **Step 7: Implement sign-in shell and auth lifecycle**

Build a minimal Hynoe-branded `index.html` with email/password sign-in, sign-out, status banner, and hidden review queue. In `app.mjs`, initialize Supabase from `window.__HYNOE_YOUTUBE_AGENT_CONFIG__`, render no owner data until a session exists, refresh on auth state change, and erase the candidate DOM immediately when the session disappears.

- [ ] **Step 8: Run Task 1 tests**

Run: `node --test youtube-agent-dashboard/tests/server.test.mjs youtube-agent-dashboard/tests/app-contract.test.mjs`
Expected: PASS.

- [ ] **Step 9: Commit Task 1**

Commit message: `feat: scaffold authenticated Render YouTube dashboard`

### Task 2: Candidate Queue and Safe Card Rendering

**Files:**
- Create: `youtube-agent-dashboard/lib/dashboard-core.mjs`
- Modify: `youtube-agent-dashboard/public/app.mjs`
- Modify: `youtube-agent-dashboard/public/styles.css`
- Create: `youtube-agent-dashboard/tests/dashboard-core.test.mjs`
- Modify: `youtube-agent-dashboard/tests/app-contract.test.mjs`

**Interfaces:**
- Consumes: authenticated Supabase client and rows from `clip_candidates`.
- Produces: `candidateBucket(candidate) -> 'review'|'processing'|'approved'|'terminal'`, `sortCandidates(candidates) -> Candidate[]`, `loadCandidates(supabase) -> Promise<Candidate[]>`, and browser `renderCandidateCard(candidate) -> HTMLElement` that writes all database text through `textContent`.

- [ ] **Step 1: Write failing queue-order tests**

Test that `ready + pending` sorts first, then queued/rendering, then approved, then rejected/failed; within a bucket sort by score descending and newest `created_at` as the tie breaker. Test rows with missing optional text fields do not throw.

- [ ] **Step 2: Run core tests and verify RED**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs`
Expected: FAIL because queue helpers do not exist.

- [ ] **Step 3: Implement candidate loading and sorting helpers**

Implement `candidateBucket`, `sortCandidates`, and `loadCandidates`. `loadCandidates` selects only fields required by the UI from `clip_candidates`; do not use a service-role client or add an owner bypass.

- [ ] **Step 4: Run core tests and verify GREEN**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs`
Expected: PASS for candidate ordering/loading tests.

- [ ] **Step 5: Add failing safe-render contract test**

Assert candidate title, hook, transcript excerpt, category, and render-error content are assigned through `textContent` or equivalent DOM text nodes rather than injected with `innerHTML`. Include a fixture title such as `<img src=x onerror=alert(1)>` and assert the implementation path treats it as text.

- [ ] **Step 6: Implement review cards and statuses**

`renderCandidateCard(candidate)` must show title, score, category, hook/excerpt when present, approval state, and distinct status copy for queued/rendering/ready/failed. Render `render_error_message` only as text. Add responsive styles for a vertical 9:16 player area and readable action controls.

- [ ] **Step 7: Run Task 2 tests**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs youtube-agent-dashboard/tests/app-contract.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit Task 2**

Commit message: `feat: add secure Shorts review queue`

### Task 3: Private Signed Preview Playback

**Files:**
- Modify: `youtube-agent-dashboard/lib/dashboard-core.mjs`
- Modify: `youtube-agent-dashboard/public/app.mjs`
- Modify: `youtube-agent-dashboard/tests/dashboard-core.test.mjs`
- Modify: `youtube-agent-dashboard/tests/app-contract.test.mjs`

**Interfaces:**
- Consumes: Supabase Storage client, candidate `render_status`, `preview_uri`, and `render_uri`.
- Produces: `previewPath(candidate) -> string|null`, `signPreview(supabase, candidate) -> Promise<string|null>`, and `attachPreview(videoElement, supabase, candidate) -> Promise<void>` with one re-sign attempt after a media error.

- [ ] **Step 1: Write failing signed-preview tests**

Assert `previewPath` prefers `preview_uri` then `render_uri`; non-ready candidates return `null`; a ready candidate calls `supabase.storage.from('clip-previews').createSignedUrl(path, 600)` exactly; returned `signedUrl` is propagated; and no `getPublicUrl` path is used.

- [ ] **Step 2: Add failure-mode tests**

Assert a ready candidate with neither URI returns a typed/structured playback error without a Storage call. Assert a media playback error obtains one fresh signed URL and updates the video source once, but does not loop forever if playback fails again.

- [ ] **Step 3: Run preview tests and verify RED**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs`
Expected: FAIL because preview helpers are missing.

- [ ] **Step 4: Implement signed preview helpers**

Implement `previewPath`, `signPreview`, and the one-retry preview refresh contract. Keep signed URLs only in browser memory; never persist them to `clip_candidates`, local storage, or logs.

- [ ] **Step 5: Wire the actual `<video controls playsinline preload="metadata">` player**

For `render_status = 'ready'`, render the video element and assign only the signed URL returned by `signPreview`. For pending/rendering rows, render a status placeholder and make no signing request. For missing-path/signing errors, show `Rendered, but preview could not be opened` plus a retry control.

- [ ] **Step 6: Run Task 3 tests**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs youtube-agent-dashboard/tests/app-contract.test.mjs`
Expected: PASS, including the exact 600-second TTL and no-public-URL checks.

- [ ] **Step 7: Commit Task 3**

Commit message: `fix: play private Shorts with signed preview URLs`

### Task 4: Owner Approval / Rejection Actions

**Files:**
- Modify: `youtube-agent-dashboard/lib/dashboard-core.mjs`
- Modify: `youtube-agent-dashboard/public/app.mjs`
- Modify: `youtube-agent-dashboard/tests/dashboard-core.test.mjs`
- Modify: `youtube-agent-dashboard/tests/app-contract.test.mjs`

**Interfaces:**
- Consumes: authenticated Supabase client, clip ID, action `approve | reject`, optional notes.
- Produces: `submitApproval(supabase, clipId, action, notes = null) -> Promise<{ clip_id, publishing_job_id, approval_state }>` and card-level action lock state.

- [ ] **Step 1: Write failing approval-contract tests**

Assert approve calls `rpc('approve_clip', { p_clip_id: id, p_action: 'approve', p_notes: notes })`; reject uses `p_action: 'reject'`; any other local action is rejected before the RPC; Supabase RPC errors propagate to the UI; and no direct `.update()` of `clip_candidates` is used.

- [ ] **Step 2: Run approval tests and verify RED**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs`
Expected: FAIL because `submitApproval` does not exist.

- [ ] **Step 3: Implement `submitApproval`**

Validate the local action enum, call only `approve_clip`, return the RPC row, and leave the server-side ownership / 90+ enforcement to the existing database function.

- [ ] **Step 4: Add failing double-click/action-lock contract test**

Assert Approve and Reject are both disabled while one RPC is in flight and restored after completion/failure. Assert a successful action triggers `loadCandidates()` before controls become active again.

- [ ] **Step 5: Implement card action locking and refresh**

Wire Approve/Reject buttons to `submitApproval`; set a per-card busy state before the promise starts; show inline success/error feedback; refresh candidates after success; and clear busy state in `finally`.

- [ ] **Step 6: Run Task 4 tests**

Run: `node --test youtube-agent-dashboard/tests/dashboard-core.test.mjs youtube-agent-dashboard/tests/app-contract.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Commit message: `feat: wire owner approval controls`

### Task 5: Security Regression, Render Deployment, and Production Verification

**Files:**
- Modify: `youtube-agent-dashboard/tests/server.test.mjs`
- Modify: `youtube-agent-dashboard/tests/app-contract.test.mjs`
- Modify: `youtube-agent-dashboard/README.md`
- No expected change: `youtube-shorts-cloud/worker.py`
- No expected change: `youtube-shorts-cloud/tests/test_worker_policy.py`

**Interfaces:**
- Consumes: completed dashboard code, Render workspace `tea-db2ioqpsrm7s73bik5qg`, Supabase public project URL/key, and existing `hynoe-shorts-cloud` service.
- Produces: healthy Render service `hynoe-youtube-agent`, public dashboard URL, unchanged worker health, and verified playable ready clip.

- [ ] **Step 1: Add final security-regression tests**

Assert browser/static files contain no `service_role`, `SHORTS_WORKER_TOKEN`, `SHORTS_WAKE_TOKEN`, refresh-token secret names, or hard-coded signed object URLs. Assert config output never serializes unrelated process environment variables.

- [ ] **Step 2: Run all dashboard tests**

Run: `node --test youtube-agent-dashboard/tests/*.test.mjs`
Expected: PASS with zero failures.

- [ ] **Step 3: Run existing worker regression tests**

Run: `python -m unittest discover -s youtube-shorts-cloud/tests -p 'test_*.py'`
Expected: all existing worker tests PASS; no dashboard change may regress the renderer.

- [ ] **Step 4: Perform a repository secret/string scan**

Search the new dashboard directory for `service_role`, `SHORTS_WORKER_TOKEN`, `SHORTS_WAKE_TOKEN`, `getPublicUrl`, and known private token prefixes. Expected: only intentional negative-test strings/documentation references, never runtime secret values or public-preview construction.

- [ ] **Step 5: Create the implementation branch for deployment**

Create `feature/youtube-agent-render-dashboard-20261007` from the implementation commit set if execution was not already isolated on that branch. Push/commit all Task 1–4 work before creating the Render service.

- [ ] **Step 6: Create the Render dashboard service**

Create Node web service `hynoe-youtube-agent` in Ohio, repo `https://github.com/HynoeGeshi/hynoesmp`, implementation branch `feature/youtube-agent-render-dashboard-20261007`, auto-deploy enabled. Build command: `npm ci && node --test youtube-agent-dashboard/tests/*.test.mjs`. Start command: `node youtube-agent-dashboard/server.mjs`.

Set only these dashboard environment variables in Render:
- `SUPABASE_URL=https://bgtxfzvzksgvradodafo.supabase.co`
- `SUPABASE_ANON_KEY=<current Supabase anon/publishable key>`

Do not copy the worker token, wake token, or service-role key into this service.

- [ ] **Step 7: Verify Render service health and unauthenticated gate**

Check the service event/deploy state and fetch `/health`; expected 200 `{ "ok": true }`. Fetch `/`; expected sign-in UI and no candidate data in the unauthenticated document.

- [ ] **Step 8: Verify current Supabase ready state before playback test**

Query the owner project and confirm at least one 90+ candidate still has `render_status = 'ready'` and a non-null private `preview_uri` or `render_uri`. Do not mark the migration complete if no rendered object exists to test.

- [ ] **Step 9: Verify authenticated playback and approval path**

Using the existing owner Supabase account, load the Render dashboard, confirm a ready card resolves a short-lived signed `clip-previews` URL and the actual MP4 plays in the `<video>` element. Confirm one non-destructive review interaction or a controlled test candidate reaches `approve_clip` and refreshes state; do not publicly publish a Short as part of this verification.

- [ ] **Step 10: Verify worker isolation**

Check `hynoe-shorts-cloud` still returns healthy status and remains a separate Render service. Do not re-enable blocked YouTube datacenter extraction scheduling as part of this dashboard migration.

- [ ] **Step 11: Keep Vercel fallback untouched and document primary URL**

Record the Render dashboard URL in `youtube-agent-dashboard/README.md`. Do not pause/delete the Vercel project. Treat Render as primary only after Step 9 passes.

- [ ] **Step 12: Commit deployment documentation**

Commit message: `docs: record Render YouTube Agent deployment`

## Completion Gate

The migration is complete only when all of the following are true:

- dashboard tests pass
- existing worker tests pass
- new Render `hynoe-youtube-agent` service is healthy
- unauthenticated users see no owner data
- an authenticated owner can watch at least one existing ready private MP4 in-browser
- Approve/Reject still goes through `approve_clip`
- no private credential is exposed to browser code
- `clip-previews` remains private
- `hynoe-shorts-cloud` remains healthy and separate
- Vercel remains available as fallback
