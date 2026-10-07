# Hynoe YouTube Agent — Render Dashboard Migration Design

Date: 2026-10-07
Status: Proposed / approved in chat, awaiting written-spec review before implementation

## Objective

Move the Hynoe YouTube Agent dashboard runtime off Vercel and onto Render while keeping the existing Render rendering worker separate, preserving Supabase as the private backend, and fixing preview playback for rendered Shorts.

Success means:

- The dashboard is accessible from a new Render web service.
- Existing Supabase authentication continues to gate access.
- Rendered clips stored in the private `clip-previews` bucket play inside the dashboard using short-lived signed URLs.
- Approve / Reject continues through the existing owner-scoped Supabase RPC flow.
- No service-role credential is exposed to browser code.
- Existing publishing safeguards remain unchanged: approval is required, score threshold stays enforced, and uploads do not automatically become public.
- Existing Vercel deployment remains untouched until the Render dashboard is verified, providing rollback/fallback.

## Current Architecture

### Render

Existing service:

- `hynoe-shorts-cloud`
- Service ID: `srv-db323j3bc2fs73cbs4l0`
- Purpose: claim queued 90+ clip candidates, obtain source media, render vertical MP4s, upload to Supabase, and complete render leases.
- Current branch: `feature/youtube-shorts-15-daily-20261007`

The worker is intentionally isolated from the user-facing dashboard so FFmpeg work cannot starve or crash the UI process.

### Supabase

Project: `hynoe-youtube-agent` (`bgtxfzvzksgvradodafo`)

Supabase remains the system of record for:

- authenticated users
- channels and ownership
- clip candidates
- approval events
- rendering state
- publishing jobs
- private `clip-previews` object storage

Existing owner-facing approval RPC:

- `approve_clip(p_clip_id uuid, p_action text, p_notes text)`

Existing service-only render RPCs remain unchanged:

- `worker_claim_clip_render`
- `worker_renew_clip_render`
- `worker_finish_clip_render`
- `worker_retry_clip_render`

### Vercel

The current `hynoe-youtube-agent` dashboard is deployed on Vercel. It is retained during migration as a fallback only. No destructive change to the Vercel project is part of this design.

## Target Architecture

### Service 1 — `hynoe-youtube-agent`

Create a new Render Node web service for the authenticated dashboard.

Responsibilities:

- serve the YouTube Agent UI
- initialize the Supabase browser client with public project URL + anon key only
- require authenticated Supabase session before dashboard data is shown
- query clip candidates through existing RLS
- request a signed preview URL for ready clips
- render the actual MP4 in a `<video controls>` player
- call the existing `approve_clip` RPC for Approve / Reject actions
- show pending, rendering, ready, approved, rejected, and failed states clearly

The dashboard must not perform rendering itself.

### Service 2 — `hynoe-shorts-cloud`

Keep the existing Python Render service separate.

Responsibilities remain:

- secure worker-token authentication
- render queue claims and leases
- media extraction / authorized-source ingestion
- FFmpeg rendering
- upload rendered MP4s to the private Supabase bucket

No UI responsibilities are added to this process.

### Supabase

Supabase remains unchanged in ownership model and remains the shared backend between the dashboard and worker.

## Preview Playback Design

The `clip-previews` bucket stays private.

For a ready clip:

1. Dashboard receives `preview_uri` / `render_uri` as a storage object path, never as a public URL.
2. The authenticated browser session calls Supabase Storage `createSignedUrl(path, ttl)` using the user's existing JWT.
3. Storage RLS verifies that the signed-in user owns the matching channel/folder.
4. The returned short-lived signed URL is assigned to the `<video>` source.
5. Signed URLs are held only in memory and regenerated after expiration or on refresh.

Recommended TTL: 10 minutes.

The implementation must not make `clip-previews` public.

## Authentication and Security

Browser-visible configuration may contain only:

- Supabase project URL
- Supabase anon/publishable key

Browser code must never contain:

- Supabase service-role key
- Render worker token
- Render wake token
- YouTube refresh tokens / OAuth secrets
- any server-side signing secret

Security requirements:

- keep existing Supabase RLS enabled
- dashboard queries must run as the logged-in user
- signed URLs must be short-lived
- do not persist signed URLs in database rows
- do not log JWTs, OAuth tokens, signed URLs, or secrets
- maintain strict server-side separation between dashboard public env vars and worker secrets
- no new public storage policy

## Dashboard Review Queue

The initial Render dashboard should prioritize the immediate workflow rather than adding unrelated features.

Each candidate card should include:

- actual video player when `render_status = ready`
- clear placeholder/status when not yet rendered
- title
- score
- category
- transcript excerpt / hook when available
- Approve button
- Reject button
- current approval state
- render error message when present

Primary queue ordering:

1. ready + pending review
2. rendering / queued
3. approved
4. rejected / failed

The dashboard should clearly distinguish "not rendered yet" from "rendered but playback failed".

## Approval Flow

Approve / Reject remains owner-scoped and must use the existing `approve_clip` RPC.

The UI should optimistically disable action buttons while the RPC is in flight, then refresh the candidate state from Supabase after success.

No client-side database update should bypass the RPC.

## Publishing Safety

This migration does not relax publishing controls.

Existing publishing rules remain:

- clip must be approved
- clip must have a valid render URI
- score threshold remains 90+
- publishing flow uploads privately first
- no automatic public publish without the existing explicit flow

## Render Deployment

Create a new Render Node web service:

- name: `hynoe-youtube-agent`
- region: Ohio
- repository: `HynoeGeshi/hynoesmp`
- branch: implementation branch derived from `feature/youtube-shorts-15-daily-20261007`
- auto-deploy: enabled after tests pass

The UI code should live in a dedicated application directory, separate from `youtube-shorts-cloud`.

Recommended directory:

- `youtube-agent-dashboard/`

Expected minimal structure:

- `package.json`
- app/server entrypoint
- static assets / client code
- tests for auth gating, signed preview generation, and approval actions

## Test Strategy

Implementation follows TDD.

Required tests before production deployment:

1. unauthenticated users cannot load owner dashboard data
2. ready clip with private object path requests a signed URL
3. pending clip does not attempt playback
4. signed preview URL is inserted into a video player
5. Approve calls `approve_clip(..., 'approve', ...)`
6. Reject calls `approve_clip(..., 'reject', ...)`
7. service-role key is absent from browser bundle/config
8. no public storage URL is constructed for private clips
9. render failure state is visible to the user
10. existing worker tests remain green

Production verification must include at least one of the three currently ready private MP4s being playable in-browser before the new dashboard is considered complete.

## Rollout

1. Implement dashboard on the existing feature branch or a child branch.
2. Run unit/integration tests.
3. Deploy new Render web service without changing Vercel.
4. Sign in to the Render dashboard using the existing Supabase account.
5. Verify one ready clip plays from a signed private URL.
6. Verify Approve / Reject changes persist through the RPC.
7. Verify worker service remains healthy and independent.
8. Only after successful verification, treat the Render URL as the primary YouTube Agent dashboard.

The Vercel deployment remains available until a later explicit cleanup request.

## Rollback

If the Render dashboard fails verification:

- leave Supabase untouched
- leave `hynoe-shorts-cloud` untouched
- stop using the new Render dashboard URL
- continue using the existing Vercel dashboard while the Render UI is repaired

Because no destructive Vercel or Supabase change is part of the migration, rollback requires no data restoration.

## Non-Goals

This migration does not attempt to:

- solve YouTube datacenter raw-media extraction restrictions
- combine FFmpeg rendering into the dashboard process
- make private preview storage public
- redesign the candidate scoring model
- change the 90+ quality floor
- auto-publish Shorts publicly
- delete the Vercel project

## Decision

Use two separate Render services in the same workspace:

- `hynoe-youtube-agent` for the UI
- `hynoe-shorts-cloud` for rendering

Keep Supabase as the secure shared backend and use authenticated short-lived signed URLs for preview playback.
