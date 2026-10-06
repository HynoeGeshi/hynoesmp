# Hynoe YouTube Agent — Automatic Render Pipeline Design

Date: 2026-10-06

## Goal

Make the Hynoe YouTube Agent continuously surface playable, post-ready Shorts without requiring manual database inserts, repeated full-video rescans, or a local PC to stay online for every render.

The immediate success condition is that the current 96/94/91 Minecraft candidates become playable in the review UI. The durable success condition is that every future candidate scoring 90 or higher automatically moves through rendering, upload, and review with no manual intervention.

## Current State

- Supabase project `bgtxfzvzksgvradodafo` is the source of truth for video sources, processing jobs, clip candidates, approvals, and preview storage.
- Existing rendered clips have `render_status = 'ready'` and a non-null `render_uri` pointing into the `clip-previews` bucket.
- The three new 96/94/91 candidates have timestamps and metadata but `render_status = 'pending'`, `render_uri = null`, and `preview_uri = null`.
- The existing processing job table is source-oriented. It has no candidate-level render queue.
- The local RTX 4070 worker previously downloaded source media, analyzed, rendered, and uploaded previews. This makes the review experience dependent on the local worker being available.
- The current YouTube Agent UI is still on Vercel. Render is the intended canonical host going forward.
- Existing Render services are unrelated to the YouTube Agent, so the agent needs its own service rather than being folded into `hynoe-creatorops`.

## Architecture

### 1. Candidate-level render queue

Add a new `render_jobs` table keyed to `clip_candidates.id`.

Each row represents one attempt to render one candidate. Core fields:

- `id uuid primary key`
- `clip_candidate_id uuid not null references clip_candidates(id)`
- `video_source_id uuid not null references video_sources(id)`
- `state text not null`
- `attempt_count integer not null default 0`
- `claimed_by text`
- `lease_expires_at timestamptz`
- `error_code text`
- `error_message text`
- `created_at timestamptz`
- `updated_at timestamptz`

Allowed states:

`queued`, `claimed`, `downloading`, `rendering`, `uploading`, `completed`, `failed_retryable`, `failed_terminal`.

A unique partial index prevents more than one active render job per candidate.

### 2. Automatic enqueue rule

A database trigger enqueues a render job whenever a clip candidate satisfies all of the following:

- `score >= 90`
- `render_status` is `pending` or null
- `render_uri` is null
- there is no active render job for the candidate

The trigger also covers updates so a candidate that is rescored upward to 90+ is automatically queued.

The existing published 86-point legacy exception is not re-rendered or modified.

### 3. Render worker on Render

Create a dedicated Render background-style web service named `hynoe-youtube-renderer` in the existing Render workspace.

Responsibilities:

1. Claim one render job with a lease.
2. Read the candidate timestamps and source YouTube video ID from Supabase.
3. Download only the source media needed for the render using yt-dlp.
4. Cut the exact `start_ms` to `end_ms` range with FFmpeg.
5. Produce the same vertical review format already used by the old worker.
6. Upload the MP4 to the `clip-previews` storage bucket using a deterministic path based on candidate ID.
7. Update the candidate to `render_status = 'ready'` and set `render_uri`.
8. Mark the render job `completed`.

The worker should run continuously on Render and poll for new render jobs. It should not depend on the user's PC being online.

### 4. Retry and lease behavior

- Jobs use leases so a crashed worker cannot permanently lock a candidate.
- A retryable failure returns the job to `failed_retryable` and increments `attempt_count`.
- Maximum automatic attempts: 3.
- Permanent failures become `failed_terminal` with a concise error code/message visible to the agent UI.
- Repeated inserts or page refreshes cannot create duplicate renders because of the active-job uniqueness rule and deterministic storage path.

### 5. Review UI fallback preview

The Hynoe YouTube Agent review card uses two preview modes:

1. If `render_uri` exists and `render_status = 'ready'`, play the rendered vertical MP4.
2. Otherwise, if the source has a YouTube video ID, show a temporary embedded YouTube preview starting at `start_ms` and ending at `end_ms`.

The card must clearly label the fallback as `Rendering preview…` so it is obvious that it is not the final vertical export.

This means the user can review a moment immediately even before the render worker finishes.

### 6. Agent hosting migration

Create a dedicated Render service named `hynoe-youtube-agent` from the same application source as the current review UI.

The Render version becomes canonical after verification. The existing Vercel deployment remains untouched during migration as rollback insurance until the Render version is confirmed working.

The Render agent reads the same Supabase data and storage paths; no database fork is introduced.

## Data Flow

1. A source processing job discovers a clip candidate.
2. Candidate is inserted or updated with a score.
3. If the score is 90+, Supabase automatically inserts a render job.
4. The Render renderer claims the job.
5. The review UI immediately shows a YouTube timestamp fallback while the job is in progress.
6. The renderer downloads, cuts, formats, and uploads the MP4.
7. Supabase updates the candidate to `ready` with `render_uri`.
8. The review UI automatically switches from the temporary YouTube preview to the rendered MP4.
9. The user approves, edits, or rejects the playable Short.
10. Existing approval and YouTube upload protection still enforce the 90+ rule.

## Security

- Supabase service-role credentials are stored only as Render secrets, never committed to GitHub or exposed to browser JavaScript.
- The browser continues to use only the minimum public/authenticated Supabase access required by the review UI.
- Render service environment variables are used for Supabase URL/key and any uploader secrets.
- The renderer validates candidate IDs and timestamps before invoking yt-dlp or FFmpeg.
- Output paths are deterministic and cannot contain user-controlled path traversal input.
- Existing server-side 90+ approval/upload enforcement remains unchanged.

## Compatibility

The migration must preserve:

- the existing `clip_candidates` rows;
- the hard 90+ rule;
- the already-published 86-point grandfathered clip;
- current approval/rejection behavior;
- current Supabase project and storage bucket;
- existing rendered clip URLs;
- current YouTube publishing flow.

No old rendered MP4 is deleted as part of this work.

## Current Candidate Backfill

After the queue is live, seed render jobs for these existing pending candidates:

- `00b68280-a38a-4dc3-822d-9d3263b6c8a4` — score 96
- `2e0d0530-bb9e-4da1-95e2-ab17368b042c` — score 94
- `8a656f0b-dadc-4b58-8482-5bacc8edadbd` — score 91

The trigger or a one-time safe insert should create exactly one render job for each.

## Testing

### Database tests

- 89-point candidate does not create a render job.
- 90-point candidate creates exactly one render job.
- Re-updating the same candidate does not create duplicates.
- A pending 90+ candidate with an existing active render job does not enqueue another.
- A candidate with `render_uri` does not enqueue another render.
- The grandfathered 86-point published clip is untouched.

### Worker tests

- Claims queued jobs with a lease.
- Uses exact start/end timestamps.
- Rejects invalid or negative ranges.
- Writes a valid MP4.
- Uploads to the expected bucket/path.
- Marks the candidate ready only after successful upload.
- Retryable failures can be reclaimed.
- After three failed attempts, the job becomes terminal.
- Running the same candidate twice is idempotent.

### UI tests

- Pending clip with a YouTube source shows the timestamp fallback.
- Ready clip shows its MP4.
- UI switches to MP4 after candidate data refreshes.
- Missing source and missing render URI shows a useful error state rather than a blank card.

### End-to-end acceptance

- The current 96/94/91 clips render without manual DB editing.
- All three become playable in the Hynoe Agent.
- Creating a new synthetic 90+ candidate automatically produces a render job.
- The Render worker processes that job without the user's PC online.
- The final rendered preview appears in the agent automatically.

## Rollout

1. Add render queue schema and trigger.
2. Deploy and verify `hynoe-youtube-renderer` on Render.
3. Backfill the three current pending 90+ clips.
4. Add fallback preview to the agent UI.
5. Deploy `hynoe-youtube-agent` on Render.
6. Verify the current old rendered clips and new 90+ clips in the Render-hosted agent.
7. Keep Vercel intact temporarily for rollback.
8. After verification, treat the Render URL as canonical.

## Non-goals

This project does not lower the 90+ threshold, automatically publish clips without review, rewrite the scoring algorithm again, or delete the existing Vercel deployment during initial rollout.
