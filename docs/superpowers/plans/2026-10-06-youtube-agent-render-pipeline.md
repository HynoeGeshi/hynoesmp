# Hynoe YouTube Agent Automatic Render Pipeline Implementation Plan

> **For implementer:** Use @superpowers:subagent-driven-development or @superpowers:executing-plans for implementation. Follow tasks in order.

**Goal:** Make every future 90+ Hynoe Short automatically render, upload to `clip-previews`, and appear playable in the Hynoe YouTube Agent on Render, while immediately showing a YouTube timestamp fallback during rendering.

**Architecture:** Add a candidate-level `render_jobs` queue to the existing Supabase project, build a dedicated Python render worker hosted on Render, import the currently deployed review UI into this repository and host it on Render, and keep the existing Vercel deployment untouched as rollback insurance until the Render version is verified. The new pipeline reuses the existing `clip_candidates`, `video_sources`, `transcript_segments`, `clip-previews`, approval RPC, and YouTube publishing flow rather than replacing them.

**Tech Stack:** PostgreSQL/Supabase, Python 3.11+, yt-dlp, FFmpeg, Supabase Storage/TUS resumable upload, Node.js 24 built-in HTTP server, vanilla HTML/CSS/JS, `@supabase/supabase-js@2`, Render, GitHub.

**Spec:** `docs/superpowers/specs/2026-10-06-youtube-agent-render-pipeline-design.md`

---

## Codex work to preserve and reuse

The implementation must treat these as compatibility contracts, not greenfield choices:

- Existing local Windows agent project was `C:\Users\relly\Desktop\Hynoe-YouTube-Agent` with worker flow `claim_job -> download_source -> transcribe -> build_candidates -> render_clip -> upload_candidates -> process`.
- Codex already changed large preview uploads to use TUS/resumable storage upload. The new cloud renderer must preserve resumable upload behavior rather than reverting to a small-file-only `.upload()` path.
- Existing preview storage path is deterministic: `<channel_id>/<candidate_id>.mp4` in bucket `clip-previews`.
- Existing vertical preview composition is 1080×1920 with blurred background, centered foreground, burnt-in SRT captions, AAC audio, and `+faststart`. The Windows worker used `h264_nvenc`; Render must use CPU `libx264` because no NVIDIA GPU is assumed.
- Existing server-side `public.approve_clip` already enforces `score >= 90`; do not weaken or replace it.
- Existing `youtube-upload-approved` Edge Function also blocks sub-90 uploads; do not weaken or replace it.
- Existing published 86-point legacy exception must stay untouched:
  - candidate `caee3417-95d1-409b-9069-6378cf9f4d9c`
  - published YouTube video `YXy7fcWg5ts`
- Current review UI already signs `render_uri` objects from `clip-previews` in `hydrateClipUrls()` and uses the existing approval/edit/reject workflow. Extend that flow; do not rebuild it from scratch.
- The current Vercel review deployment is reference/rollback only. New production work targets Render.
- Prior V3/V3.1 local patch attempts are not source-of-truth and must not be copied into the new service. The new pipeline is server-side and candidate-driven so it does not depend on those local patches.

## Global constraints

- Supabase project is `bgtxfzvzksgvradodafo`.
- Render workspace is `tea-db2ioqpsrm7s73bik5qg`.
- Start new Render services on the free plan unless metrics prove it cannot render reliably; do not silently create a paid service.
- Store `SUPABASE_SERVICE_ROLE_KEY` only in Render server-side environment variables.
- Browser code may receive only the Supabase URL and publishable/anon key.
- Do not auto-publish a Short. Rendering and review are automatic; publishing still requires the existing approval action.
- Do not delete existing rendered clips or the Vercel deployment during rollout.
- All candidate render jobs are idempotent and deterministic by candidate ID.
- A job may retry automatically at most three times.
- Never mark a candidate `ready` until the MP4 upload has completed successfully.
- Every implementation task starts with a failing test or an explicit failing verification before code changes.

---

### Task 1: Add the candidate render queue, claim RPCs, trigger, and safe backfill

**Files:**
- Create: `supabase/migrations/20261006_youtube_render_jobs.sql`
- Create: `tests/youtube-render-queue.sql`

**Interfaces:**
- Table: `public.render_jobs`
- RPC: `public.claim_next_render_job(p_worker_id text, p_lease_seconds int default 900)`
- RPC: `public.update_render_job_state(...)`
- Trigger function: `public.enqueue_render_job_for_clip()`
- Trigger on `public.clip_candidates` insert/update of `score`, `render_status`, and `render_uri`.

- [ ] **Step 1: Write the failing SQL contract test**

The test must prove:
- an 89-point pending candidate creates zero render jobs;
- a 90-point pending candidate creates exactly one render job;
- updating the same candidate repeatedly does not create duplicates;
- a 90+ candidate with non-null `render_uri` creates no new job;
- a ready candidate creates no new job;
- expired `claimed` and `failed_retryable` jobs are reclaimable;
- three failed attempts transition to terminal behavior;
- the legacy 86 candidate is unchanged and has no render job created merely because this migration runs.

- [ ] **Step 2: Run the test against a disposable transaction and verify failure**

Run with the project SQL test harness or `psql` against a local/test database:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/youtube-render-queue.sql
```

Expected: FAIL because `render_jobs` and the render-job RPCs do not exist.

- [ ] **Step 3: Implement `render_jobs`**

Required states:

```text
queued
claimed
downloading
rendering
uploading
completed
failed_retryable
failed_terminal
```

Core columns:

```sql
id uuid primary key default gen_random_uuid(),
clip_candidate_id uuid not null references public.clip_candidates(id) on delete cascade,
channel_id uuid not null,
video_source_id uuid not null references public.video_sources(id) on delete cascade,
state text not null default 'queued',
attempt_count integer not null default 0,
claimed_by text,
lease_expires_at timestamptz,
error_code text,
error_message text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Add a partial unique index preventing more than one active job per `clip_candidate_id` for `queued|claimed|downloading|rendering|uploading|failed_retryable`.

- [ ] **Step 4: Implement trigger and RPCs**

`enqueue_render_job_for_clip()` queues only when:

```text
score >= 90
render_uri is null
coalesce(render_status, 'pending') <> 'ready'
no active render job exists
```

`claim_next_render_job()` must use `FOR UPDATE SKIP LOCKED`, increment `attempt_count`, set a lease, and return the joined payload needed by the worker: job ID, candidate ID, channel ID, source ID, YouTube video ID, start/end milliseconds, score, title, and transcript excerpt.

`update_render_job_state()` must validate allowed transitions and clear/extend leases appropriately.

Revoke direct execute from `anon` and `authenticated`; grant render-worker RPC use only to `service_role`.

- [ ] **Step 5: Add predicate-based backfill**

Do not hardcode generated IDs in the migration. Backfill with a predicate equivalent to:

```sql
score >= 90
and render_uri is null
and coalesce(render_status, 'pending') <> 'ready'
```

The current data should naturally enqueue the existing 96/94/91 candidates exactly once.

- [ ] **Step 6: Run SQL tests again**

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20261006_youtube_render_jobs.sql tests/youtube-render-queue.sql
git commit -m "feat: add automatic shorts render queue"
```

---

### Task 2: Build the CPU Render renderer and preserve the Codex preview format

**Files:**
- Create: `youtube-agent/renderer/render.py`
- Create: `youtube-agent/renderer/transcript.py`
- Create: `youtube-agent/renderer/download.py`
- Create: `youtube-agent/renderer/models.py`
- Create: `youtube-agent/renderer/requirements.txt`
- Create: `tests/test_youtube_renderer.py`

**Interfaces:**
- `validate_clip_range(start_ms, end_ms) -> tuple[float, float]`
- `download_clip_source(youtube_video_id, start_s, end_s, workdir) -> Path`
- `build_srt(segments, clip_start_ms, clip_end_ms) -> str`
- `render_vertical_preview(source_path, subtitle_path, output_path, duration_s) -> None`

- [ ] **Step 1: Write failing unit tests**

Assertions:
- negative starts, `end <= start`, and durations over 60 seconds are rejected;
- exact milliseconds are converted to seconds without whole-second truncation;
- transcript segments outside the clip are ignored;
- SRT timestamps are shifted relative to clip start;
- FFmpeg command targets 1080×1920;
- FFmpeg filter creates a blurred full-frame background plus centered foreground;
- subtitles are burnt in near the lower center;
- codec is `libx264`, not `h264_nvenc`;
- output includes AAC 160k and `-movflags +faststart`.

- [ ] **Step 2: Run tests and verify failure**

```bash
python -m unittest -v tests.test_youtube_renderer
```

Expected: FAIL because renderer modules do not exist.

- [ ] **Step 3: Implement partial YouTube download**

Use yt-dlp and download only the requested time range with a small safety pad rather than the entire multi-hour stream. Prefer 1080p-or-lower video plus audio. Keep source downloads in an ephemeral per-job directory.

If partial section download is unavailable for a specific source, fall back to a bounded full-source download only when disk limits allow; otherwise return `youtube_download_failed` rather than hanging indefinitely.

- [ ] **Step 4: Implement the vertical preview render**

Preserve the existing visual contract but use CPU encoding:

```text
1080x1920
blurred background
centered foreground
burnt-in captions
libx264
preset veryfast
CRF 22
AAC 160k
+faststart
```

Do not add unrelated visual redesign in this task.

- [ ] **Step 5: Run tests and a local synthetic FFmpeg smoke render**

Expected: tests PASS and `ffprobe` reports a valid 1080×1920 H.264/AAC MP4.

- [ ] **Step 6: Commit**

```bash
git add youtube-agent/renderer tests/test_youtube_renderer.py
git commit -m "feat: add cloud shorts renderer"
```

---

### Task 3: Add resumable storage upload, worker loop, retries, and health service

**Files:**
- Create: `youtube-agent/renderer/storage.py`
- Create: `youtube-agent/renderer/supabase_queue.py`
- Create: `youtube-agent/renderer/worker.py`
- Create: `youtube-agent/renderer/service.py`
- Create: `tests/test_youtube_storage.py`
- Create: `tests/test_youtube_worker.py`

**Interfaces:**
- `upload_preview_resumable(file_path, channel_id, candidate_id) -> str`
- `claim_next_render_job(worker_id, lease_seconds) -> RenderJob | None`
- `run_render_job(job) -> None`
- `run_worker_loop(stop_event) -> None`
- HTTP `GET /healthz` on Render `PORT`.

- [ ] **Step 1: Write failing storage/worker tests**

Assertions:
- storage path is exactly `<channel_id>/<candidate_id>.mp4`;
- upload uses TUS/resumable semantics with approximately 6 MiB chunks rather than a one-shot small-file upload;
- candidate remains pending if upload fails;
- after successful upload, candidate gets `render_uri` and `render_status='ready'` before job is completed;
- retryable download/render/upload errors become `failed_retryable` when attempt count < 3;
- third failure becomes `failed_terminal`;
- lease-expired jobs can be reclaimed;
- reprocessing an already-ready candidate is idempotent;
- temporary job directories are cleaned on success and failure;
- `/healthz` returns service status without secrets.

- [ ] **Step 2: Run tests and verify failure**

```bash
python -m unittest -v tests.test_youtube_storage tests.test_youtube_worker
```

Expected: FAIL.

- [ ] **Step 3: Implement the queue client and TUS upload**

Use Supabase service-role credentials only from environment:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STORAGE_BUCKET=clip-previews
RENDER_WORKER_ID=hynoe-render-01
RENDER_POLL_SECONDS=10
RENDER_LEASE_SECONDS=900
```

Never print the service-role key or request authorization headers.

- [ ] **Step 4: Implement `service.py`**

Because the available Render automation creates web services, run the worker loop in a background thread/process and expose a tiny stdlib HTTP health server on `PORT`.

Health response should include only safe fields such as:

```json
{"ok":true,"service":"hynoe-youtube-renderer","worker":"hynoe-render-01"}
```

- [ ] **Step 5: Run tests and a mocked end-to-end worker iteration**

Expected: PASS; one mocked queued job traverses `claimed -> downloading -> rendering -> uploading -> completed` and produces a deterministic `render_uri`.

- [ ] **Step 6: Commit**

```bash
git add youtube-agent/renderer tests/test_youtube_storage.py tests/test_youtube_worker.py
git commit -m "feat: add resilient shorts render worker"
```

---

### Task 4: Import the current review UI and add instant fallback previews

**Files:**
- Create: `youtube-agent/web/src/index.html`
- Create: `youtube-agent/web/src/optimize.html`
- Create: `youtube-agent/web/src/app.js`
- Create: `youtube-agent/web/src/styles.css`
- Create: `youtube-agent/web/server.mjs`
- Create: `tests/youtube-agent-web.test.mjs`

**Source-of-truth for import:** Copy the currently deployed Vercel files exactly first, then modify the repository copy. Do not rebuild the page from memory.

**Interfaces:**
- Existing `hydrateClipUrls(rows)` continues signing ready `render_uri` files.
- Candidate query also retrieves the source `youtube_video_id`.
- Pending candidates expose a YouTube fallback URL using exact `start_ms` and `end_ms`.
- UI refreshes candidate state every 10–15 seconds and automatically swaps fallback iframe to MP4 when ready.

- [ ] **Step 1: Import the deployed UI unchanged and write a baseline test**

Test that the imported files still contain the existing Supabase channel initialization, clip review controls, and signed preview URL behavior.

- [ ] **Step 2: Add failing fallback tests**

Assertions:
- pending 96/94/91-like rows with a YouTube ID render a playable YouTube iframe/link instead of a blank card;
- iframe start is `floor(start_ms / 1000)`;
- iframe end is `ceil(end_ms / 1000)`;
- card label says `Rendering preview…` while no final MP4 exists;
- every fallback includes an `Open on YouTube` link in case embedding is blocked;
- ready rows still use signed MP4 URLs and `<video controls>`;
- missing both source ID and render URI shows an explicit waiting/error state;
- approval/edit/reject buttons are preserved.

- [ ] **Step 3: Run the test and verify failure**

```bash
node --test tests/youtube-agent-web.test.mjs
```

Expected: FAIL because fallback rendering and the Render server do not exist yet.

- [ ] **Step 4: Implement fallback and polling**

Extend the current query/join to include `video_sources.youtube_video_id`. Keep `hydrateClipUrls()` for ready objects. Add a helper such as:

```js
buildYoutubePreviewUrl(videoId, startMs, endMs)
```

Refetch clips every 10–15 seconds while pending renders exist; stop/reduce polling when none remain.

- [ ] **Step 5: Add the Render static server**

Follow the existing dependency-free `creatorops/server.mjs` pattern: Node built-in `http`, `/healthz`, bounded static paths, no directory traversal, no secrets.

CSP must allow the existing Supabase/CDN usage plus YouTube fallback frames, including:

```text
frame-src https://www.youtube.com https://www.youtube-nocookie.com
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

If the current UI imports Supabase from `esm.sh`, preserve and explicitly allow that origin rather than silently breaking startup.

- [ ] **Step 6: Move browser-safe config to `/config.json`**

Render environment:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

`server.mjs` may expose only those public values. Never expose `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 7: Run tests**

```bash
node --test tests/youtube-agent-web.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add youtube-agent/web tests/youtube-agent-web.test.mjs
git commit -m "feat: add instant shorts previews to Hynoe agent"
```

---

### Task 5: Deploy the renderer and agent to Render

**Files:**
- Modify only if needed: `youtube-agent/renderer/requirements.txt`
- No secrets committed.

**Render workspace:** `tea-db2ioqpsrm7s73bik5qg`

- [ ] **Step 1: Create an implementation branch before production-side-effect work**

```bash
git checkout -b feature/youtube-agent-render-pipeline
```

If implementation commits were made through the GitHub API, create/move the branch to the tested commit and deploy that branch.

- [ ] **Step 2: Create `hynoe-youtube-renderer` on Render**

Initial configuration:

```text
runtime: python
region: ohio
plan: free
build: pip install -r youtube-agent/renderer/requirements.txt
start: python youtube-agent/renderer/service.py
health: /healthz
```

Set secrets/environment without logging values:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STORAGE_BUCKET=clip-previews
RENDER_WORKER_ID=hynoe-render-01
RENDER_POLL_SECONDS=10
RENDER_LEASE_SECONDS=900
```

Do not upgrade to a paid plan without evidence that the free instance cannot complete the render and explicit user approval for cost.

- [ ] **Step 3: Create `hynoe-youtube-agent` on Render**

```text
runtime: node
region: ohio
plan: free
build: node --test tests/youtube-agent-web.test.mjs
start: node youtube-agent/web/server.mjs
health: /healthz
```

Environment:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

- [ ] **Step 4: Verify both services are healthy before touching canonical links**

Expected:
- renderer `/healthz` -> 200
- agent `/healthz` -> 200
- agent page loads and displays old ready MP4 cards.

- [ ] **Step 5: Keep Vercel untouched**

Do not delete, pause, or overwrite the existing Vercel deployment during this task.

---

### Task 6: Apply the queue migration and render the current 96/94/91 clips

**Live project:** `bgtxfzvzksgvradodafo`

- [ ] **Step 1: Capture pre-migration regression state**

Record:
- current `clip-previews` object count (expected baseline from prior inspection: 5);
- current 96/94/91 candidate rows and null `render_uri` values;
- legacy 86 candidate state and published YouTube ID;
- current `approve_clip` function definition containing the 90-point enforcement.

- [ ] **Step 2: Apply `20261006_youtube_render_jobs.sql` as a Supabase migration**

Expected: the migration succeeds atomically and the predicate backfill produces exactly three active render jobs for the current pending 90+ candidates.

- [ ] **Step 3: Verify queue rows**

Expected candidates:

```text
96 — 00b68280-a38a-4dc3-822d-9d3263b6c8a4
94 — 2e0d0530-bb9e-4da1-95e2-ab17368b042c
91 — 8a656f0b-dadc-4b58-8482-5bacc8edadbd
```

There must be exactly one active render job per candidate and none for the legacy 86 merely due to backfill.

- [ ] **Step 4: Watch one Render-worker processing cycle**

Do not poll continuously. Inspect Render events/logs after enough time for one clip to process.

Expected state progression:

```text
queued -> claimed -> downloading -> rendering -> uploading -> completed
```

- [ ] **Step 5: Verify all three candidates become ready**

Expected:

```text
render_status = 'ready'
render_uri = '<channel_id>/<candidate_id>.mp4'
```

Expected storage object count: baseline 5 -> 8, assuming no unrelated new preview objects were added concurrently.

If Render free-tier memory/CPU kills occur, capture metrics/event reason before proposing a paid upgrade.

- [ ] **Step 6: Verify they are playable in the Render-hosted Hynoe Agent**

Each card must first be reviewable through fallback while pending and then switch to its final MP4 when ready.

---

### Task 7: Final regressions, automatic-future-candidate proof, and rollout handoff

- [ ] **Step 1: Re-run all new tests**

```bash
python -m unittest -v tests.test_youtube_renderer tests.test_youtube_storage tests.test_youtube_worker
node --test tests/youtube-agent-web.test.mjs
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/youtube-render-queue.sql
```

Expected: all PASS.

- [ ] **Step 2: Re-run existing relevant repository tests**

Run the current Node regression subset/full suite required by the branch. Expected: no unrelated regressions.

- [ ] **Step 3: Prove automatic future behavior with a synthetic test candidate**

Inside a transaction or clearly tagged test source, insert/update a 90+ pending candidate and verify a render job appears automatically without a manual render insert. Roll back/delete the synthetic test record afterward.

- [ ] **Step 4: Re-verify hard 90+ approval protection**

Expected:
- 89-point approval is rejected by `approve_clip`;
- 90-point approval remains allowed;
- do not alter the YouTube uploader's independent sub-90 guard.

- [ ] **Step 5: Re-verify legacy 86 exception**

Candidate `caee3417-95d1-409b-9069-6378cf9f4d9c` must still be approved/ready and published YouTube video `YXy7fcWg5ts` must be unchanged.

- [ ] **Step 6: Verify old ready clips still play**

Old `render_uri` objects must still sign and load from `clip-previews`; no migration should have rewritten or deleted them.

- [ ] **Step 7: Make Render the documented canonical agent URL only after acceptance**

Acceptance requires:
- both Render services healthy;
- 96/94/91 cards playable;
- automatic 90+ enqueue proven;
- hard 90 approval guard intact;
- legacy 86 untouched.

Keep the Vercel deployment available temporarily as rollback insurance.

- [ ] **Step 8: Commit any final verification/docs changes**

```bash
git add youtube-agent supabase tests docs
git commit -m "feat: automate Hynoe Shorts rendering on Render"
```

---

## Acceptance checklist

- [ ] Current 96/94/91 Shorts are playable in the Hynoe Agent.
- [ ] Future 90+ candidates automatically enqueue renders.
- [ ] Renderer works while the user's PC is off.
- [ ] Pending candidates are immediately viewable through YouTube timestamp fallback.
- [ ] Ready candidates automatically switch to final MP4 previews.
- [ ] TUS/resumable uploads are preserved.
- [ ] `clip-previews` path compatibility is preserved.
- [ ] Approval/edit/reject UI behavior is preserved.
- [ ] Hard 90+ approval and upload protections remain live.
- [ ] Published legacy 86 clip is untouched.
- [ ] No service-role secret is exposed client-side or committed.
- [ ] Vercel remains available as rollback until Render is accepted.
