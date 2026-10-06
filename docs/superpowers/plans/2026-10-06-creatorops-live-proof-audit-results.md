# CreatorOps Live Proof + Starter Audit Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stale hardcoded CreatorOps proof metrics with verified server-backed snapshots and make every successful audit submission atomically produce a private 30-day Starter Creator Audit report.

**Architecture:** Keep the existing browser → Render → Ed25519-signed Supabase gateway trust path. Add two deny-by-default Supabase tables, one atomic Postgres function for application/report creation, deterministic report generation on Render, a read-only public metrics route, and an opaque-token report route. No browser gets Supabase credentials, analytics credentials, application UUIDs, report UUIDs, token hashes, or raw private analytics.

**Tech Stack:** Node.js 24 built-in HTTP/crypto APIs, vanilla HTML/CSS/JS, Supabase Postgres + Edge Function, Render, existing Stripe sandbox integration.

**Spec:** `docs/superpowers/specs/2026-10-06-creatorops-live-proof-audit-results-design.md`

## Global Constraints

- Use Render + Supabase + Stripe sandbox only; no Vercel dependency, configuration, deployment, or URL.
- Preserve Ed25519 signing between Render and `creatorops-gateway`.
- Preserve existing intake validation, 32 KB payload limit, honeypot behavior, IP rate limiting, user-agent hashing, admin Basic Auth, CSP, HSTS, COOP/CORP, and Stripe sandbox flow.
- Browser roles remain deny-by-default on private CreatorOps tables.
- Raw report tokens must never be stored in Supabase; store SHA-256 token hashes only.
- Report tokens use at least 192 bits of entropy, are URL-safe, expire after 30 days, and never encode PII or database identifiers.
- Public proof metrics must always show an `as_of` timestamp and must not use “live”/“real-time” language for manually verified snapshots.
- Starter audits are deterministic and must not fabricate performance metrics, competitor claims, profile-inspection claims, or guaranteed growth.
- `priority_actions` must contain exactly 3 items; `seven_day_plan` must contain exactly 7 items.
- Private report JSON and HTML are `no-store`; report pages are `noindex, nofollow, noarchive`.
- Unknown, malformed, expired, revoked, and unavailable report tokens must be indistinguishable to the caller.

## Review Focus

- Duplicate intake inside the 10-minute window rotates the report token and invalidates the old link without exposing the previous raw token.
- Report-route probing cannot distinguish malformed, unknown, expired, revoked, or missing reports; all return the same generic response.
- Manual metric snapshots older than seven days are labeled `stale_verified_snapshot`, never `fresh`.
- Honeypot quiet-success requests create neither an application nor an audit report.
- Main-page failure to fetch metrics removes/neutralizes numbers rather than falling back to stale hardcoded values.

### Task 1: Add database schema, verified snapshot seed, and atomic intake/report function

**Files:**
- Create via Supabase migration: `creatorops_public_metrics`, `creatorops_audit_reports`, and `public.creatorops_create_or_rotate_audit(...)`
- Test: SQL verification queries executed after migration

**Interfaces:**
- Consumes: existing `public.creatorops_applications` table and its 10-minute email duplicate rule.
- Produces: `creatorops_public_metrics`, `creatorops_audit_reports`, and Postgres function `public.creatorops_create_or_rotate_audit(p_application jsonb, p_report jsonb, p_token_hash text, p_expires_at timestamptz)` returning `{duplicate boolean, created_at timestamptz}` without returning application/report IDs.

- [ ] **Step 1: Write pre-migration verification queries**

Assert the two tables and function do not yet exist and record current CreatorOps application count.

- [ ] **Step 2: Run the verification queries and confirm the expected missing objects**

Run through Supabase SQL. Expected: no rows for the two new relations/function.

- [ ] **Step 3: Apply the migration**

Create both tables with RLS enabled and no anon/authenticated policies; add indexes on `snapshot_key`, `token_hash`, `application_id`, and `expires_at`; add `verification_mode in ('manual_verified','automated_verified')`; add report status constraint `('ready','superseded','revoked')`; add cascade FK to applications.

Create `public.creatorops_create_or_rotate_audit(...)` as a single Postgres transaction boundary that:
- validates the expected JSON fields;
- searches for same-email application created within 10 minutes;
- inserts a new application + report when no duplicate exists;
- for a duplicate with a ready report, updates report content, expiry, and token hash to the newly supplied values;
- creates a report if the duplicate application somehow has none;
- returns only `duplicate` and `created_at`.

- [ ] **Step 4: Seed the verified Hynoe YouTube snapshot**

Seed `snapshot_key='hynoe_youtube_case_study'`, `verification_mode='manual_verified'`, source `youtube_via_windsor_verified_snapshot`, and the approved Oct 6 values: subscribers 544, views_30d 2349, watch_minutes_30d 12762, watch_hours_30d 212.7, likes_30d 122, comments_30d 36, shares_30d 23, subscribers_gained_30d 8, subscribers_lost_30d 3, net_subscribers_30d 5.

- [ ] **Step 5: Verify schema and RLS behavior**

Run SQL to confirm tables/function/indexes exist, seeded snapshot matches expected values, application count is unchanged, RLS is enabled, and no anon/authenticated policies exist.

- [ ] **Step 6: Commit migration artifact/documentation if represented in repo**

Commit message: `feat: add CreatorOps audit report and metric storage`.

### Task 2: Add deterministic Starter Creator Audit engine

**Files:**
- Create: `creatorops/audit-engine.mjs`
- Create: `tests/creatorops-audit-engine.test.mjs`

**Interfaces:**
- Produces: `generateStarterAudit(input) -> report`
- Input shape: `{ creatorName, primaryPlatform, profileUrl, goal, bottleneck, revenue, interest }`
- Output shape: spec version 1 report with exactly 3 `priority_actions` and 7 `seven_day_plan` items.

- [ ] **Step 1: Write failing deterministic-engine tests**

Tests must assert:
- bottleneck text about views/clicks/titles selects `packaging`;
- overwhelm/admin/workflow language selects `operations`;
- money/revenue/sponsor language selects `monetization`;
- consistency/schedule/burnout language selects `consistency`;
- unclear input falls back to `positioning` using fixed tie priority;
- identical input returns deep-equal reports;
- reports contain exactly 3 priority actions and 7 plan days;
- copy includes the starter-audit limitation and no fabricated metrics.

- [ ] **Step 2: Run the engine tests to verify RED**

Run: `node --test tests/creatorops-audit-engine.test.mjs`
Expected: FAIL because module/export does not exist.

- [ ] **Step 3: Implement `generateStarterAudit(input)`**

Use explicit category scoring helpers and platform-aware templates. Keep scoring and templates inside this module; no HTTP/database imports.

- [ ] **Step 4: Run the engine tests to verify GREEN**

Run: `node --test tests/creatorops-audit-engine.test.mjs`
Expected: all audit-engine tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add deterministic CreatorOps starter audit engine`.

### Task 3: Extend signed Supabase gateway operations

**Files:**
- Modify deployed `creatorops-gateway` Edge Function source
- Test: gateway behavior via signed Render integration tests in Task 5 plus direct SQL checks for persistence

**Interfaces:**
- Consumes: Task 1 tables/function and existing Ed25519 request verification.
- Produces gateway operations:
  - `intake-with-report` POST
  - `report-read` POST
  - `public-metrics` GET
  - updated `admin-list` GET with audit metadata

- [ ] **Step 1: Define failing gateway-contract expectations in integration tests**

Add expectations for the four operations to `tests/creatorops-integration.test.mjs` using an injectable gateway stub first; do not deploy gateway changes until server-side contract is pinned.

- [ ] **Step 2: Deploy gateway version with `intake-with-report`**

Parse and validate application/report/token-hash/expiry payload; call `creatorops_create_or_rotate_audit`; return only `{ok, duplicate, createdAt}`.

- [ ] **Step 3: Add `report-read`**

Accept only a 64-char SHA-256 token hash. Query ready, unexpired report by hash. Return only allow-listed report fields and expiry; all not-found/expired/revoked cases return identical 404 `{error:'report_not_found'}`.

- [ ] **Step 4: Add `public-metrics`**

Ignore arbitrary client keys and fetch only `hynoe_youtube_case_study`. Return allow-listed metric fields, source, `asOf`, `verifiedAt`, and computed freshness. `manual_verified` can only yield `verified_snapshot` or `stale_verified_snapshot`; `fresh` is reserved for `automated_verified` within threshold.

- [ ] **Step 5: Extend `admin-list` with report metadata only**

Return `audit_status`, `audit_created_at`, and `audit_expires_at`; never return raw token/token hash/report body through the list endpoint.

- [ ] **Step 6: Verify unauthorized requests still fail**

Unsigned/bad-signature requests must still return 401.

### Task 4: Add Render routes, token generation, and report shell

**Files:**
- Modify: `creatorops/server.mjs`
- Create: `creatorops/report.html`
- Create: `creatorops/report.js`
- Modify: `creatorops/creatorops.css`

**Interfaces:**
- Consumes: `generateStarterAudit(input)`, gateway operations from Task 3.
- Produces:
  - `POST /api/intake` response `{ok, duplicate, report:{url,expiresAt}}`
  - `GET /api/public/metrics/hynoe-youtube`
  - `GET /api/report/:token`
  - `GET /creatorops/report/:token`

- [ ] **Step 1: Write failing route tests**

In `tests/creatorops-integration.test.mjs`, assert real HTTP requests against `createCreatorOpsServer({gatewayFn: mock})` where the injectable gateway captures operations.

Required assertions:
- valid POST generates a URL-safe token with at least 32 random bytes before encoding, sends only its SHA-256 hash upstream, and returns no IDs/email/token hash;
- duplicate response still returns a newly generated report URL;
- honeypot returns quiet success without gateway call;
- malformed/wrong-content-type/invalid/rate-limited intake preserves existing status semantics;
- public metrics route proxies only the fixed metric key;
- malformed/unknown report paths return generic 404;
- valid report retrieval sends the hash upstream, not raw token;
- report JSON uses `Cache-Control: no-store`.

- [ ] **Step 2: Run route tests to verify RED**

Run: `node --test tests/creatorops-integration.test.mjs`
Expected: FAIL on missing route/token/report behavior.

- [ ] **Step 3: Refactor gateway call boundary for test injection**

Extend `createCreatorOpsServer(options)` with optional `gatewayFn`. Production default remains the existing signed Ed25519 gateway implementation. Tests can inject a deterministic in-memory function without secrets.

- [ ] **Step 4: Update `/api/intake`**

After current validation succeeds: generate starter audit, create 32 random bytes with `randomBytes(32)`, encode URL-safe base64url, hash SHA-256, set expiry `now + 30 days`, send `intake-with-report`, and return report URL only after upstream success.

- [ ] **Step 5: Add metrics and report API routes**

Use a separate report-read rate-limit map. Validate token syntax before hashing. Map any gateway 404/expired/revoked/malformed condition to the same public 404 body.

- [ ] **Step 6: Add report HTML route and noindex headers**

Serve `report.html` at `/creatorops/report/:token` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.

- [ ] **Step 7: Build safe report renderer**

`report.js` extracts the route token, fetches `/api/report/:token`, and renders all dynamic report strings with `textContent`/DOM node creation only. No dynamic `innerHTML`.

- [ ] **Step 8: Add report styling**

Extend existing CreatorOps visual system for report summary, top-three actions, seven-day plan, monetization opportunity, limitations, and recommended offer.

- [ ] **Step 9: Run route tests to verify GREEN**

Run: `node --test tests/creatorops-integration.test.mjs`
Expected: all integration route tests pass.

- [ ] **Step 10: Commit**

Commit message: `feat: add private CreatorOps starter audit reports`.

### Task 5: Replace hardcoded proof metrics and upgrade post-submit UX

**Files:**
- Modify: `creatorops/index.html`
- Modify: `creatorops/creatorops.js`
- Modify: `creatorops/creatorops.css`
- Modify: `tests/creatorops-mvp.test.mjs`

**Interfaces:**
- Consumes: `/api/public/metrics/hynoe-youtube` and `POST /api/intake` report response.
- Produces: hydrated proof panel with freshness label and post-submit `View my audit` CTA.

- [ ] **Step 1: Write failing UI contract tests**

Assert HTML contains metric placeholders/data hooks but does not contain the old hardcoded 2,235/209/116/21 values or the new numeric snapshot literals. Assert JS fetches the fixed metrics API, displays `as of`, handles `stale_verified_snapshot`, and never writes “live” for manual snapshots.

Assert submit success copy becomes `Your Starter Creator Audit is ready.` and creates a same-origin `View my audit` link from returned report URL.

- [ ] **Step 2: Run MVP tests to verify RED**

Run: `node --test tests/creatorops-mvp.test.mjs`
Expected: FAIL on hardcoded metric and old review-queue behavior.

- [ ] **Step 3: Replace proof literals with semantic placeholders**

Keep labels/layout but remove numeric fallback values from HTML. Add an `as-of` element and an unavailable state.

- [ ] **Step 4: Add metric hydration**

Fetch the fixed metrics endpoint on load. Render only allow-listed response fields. On failure, show `Verified metrics temporarily unavailable` and no stale numeric fallback.

- [ ] **Step 5: Update intake success UX**

After successful response, display ready state and `View my audit`. Clear session draft only after report URL exists. Preserve sandbox checkout behavior based on selected interest.

- [ ] **Step 6: Run MVP tests to verify GREEN**

Run: `node --test tests/creatorops-mvp.test.mjs`
Expected: all public funnel/design/security UI tests pass.

- [ ] **Step 7: Commit**

Commit message: `feat: connect CreatorOps proof and audit result UX`.

### Task 6: Add admin report metadata without exposing report tokens

**Files:**
- Modify: `creatorops/admin.js`
- Modify: `creatorops/admin.html` only if a new column/label is required
- Modify: `tests/creatorops-server.test.mjs`

**Interfaces:**
- Consumes: updated `admin-list` application shape.
- Produces: operator-visible audit status/created/expiry metadata.

- [ ] **Step 1: Write failing admin security/metadata tests**

Assert admin list includes audit status metadata but contains no `token`, `token_hash`, or report body. Assert unauthenticated admin requests remain 401.

- [ ] **Step 2: Run server tests to verify RED**

Run: `node tests/creatorops-server.test.mjs`
Expected: FAIL on missing audit metadata contract.

- [ ] **Step 3: Render audit metadata in admin UI**

Show status and expiry in the application card/table. Do not add a raw report-link action in this iteration.

- [ ] **Step 4: Run server tests to verify GREEN**

Run: `node tests/creatorops-server.test.mjs`
Expected: server/security contract passes.

- [ ] **Step 5: Commit**

Commit message: `feat: surface CreatorOps audit status in admin`.

### Task 7: Run full end-to-end verification with temporary TEST data and clean it up

**Files:**
- Test only; no product file required unless a failure exposes a bug

**Interfaces:**
- Consumes: deployed Render app, Supabase tables/function/gateway.
- Produces: fresh evidence that browser-equivalent HTTP intake creates a report and that private/report security behavior works in production.

- [ ] **Step 1: Run the full local/build contract**

Run:
`node --test tests/creatorops-audit-engine.test.mjs tests/creatorops-integration.test.mjs tests/creatorops-mvp.test.mjs && node tests/creatorops-server.test.mjs`
Expected: all tests pass, zero failures.

- [ ] **Step 2: Wait for Render auto-deploy and verify build logs**

Expected: test command succeeds, CreatorOps preflight passes, service reaches `live` on the exact head commit.

- [ ] **Step 3: Verify public metrics endpoint**

GET `/api/public/metrics/hynoe-youtube`.
Expected: HTTP 200, exact verified snapshot values, `asOf`, and non-live freshness semantics.

- [ ] **Step 4: POST a clearly labeled TEST audit through the live Render endpoint**

Use non-sensitive test data and a TEST-only email/address value. Expected: HTTP 201/200 with opaque `/creatorops/report/<token>` URL and expiry, no database IDs or email echo.

- [ ] **Step 5: GET the returned report page and API**

Expected: report page 200 with noindex/no-store headers; API returns version 1 report with exactly 3 actions + 7 days and no PII/internal IDs.

- [ ] **Step 6: Test token failure equivalence**

Check malformed, random-valid-format, and post-expiry/revoked simulation through the gateway/test harness. Expected: same generic 404 public shape.

- [ ] **Step 7: Verify Supabase persistence**

Confirm one TEST application and one ready audit report exist, token stored only as hash, raw token absent, and report FK matches the test application.

- [ ] **Step 8: Clean up TEST data**

Delete only the clearly labeled TEST application; cascade must remove its audit report. Re-query to prove zero matching TEST rows remain.

- [ ] **Step 9: Verify unrelated CreatorOps payment/webhook path remains healthy**

Confirm webhook service still live and existing payment-event schema/count unaffected.

### Task 8: Final security review, PR update, and completion gate

**Files:**
- Modify: PR #18 body only
- No production code unless review finds a defect

**Interfaces:**
- Consumes: all prior tasks.
- Produces: release-ready branch with evidence-based completion statement.

- [ ] **Step 1: Run Supabase security/performance advisors**

Expected: no new unexpected CreatorOps security findings. Intentional RLS/no-browser-policy notices may remain documented.

- [ ] **Step 2: Search repo/client assets for secret or identifier leaks**

Check for Supabase service keys, Render signing private key, Stripe webhook secret, admin password, raw report tokens, and Windsor credentials. Expected: none in committed client/server source except public Ed25519 verification key where designed.

- [ ] **Step 3: Verify report and metrics cache/indexing controls**

Expected: reports `no-store` + noindex headers/meta; public metrics may be short-cache/no-store according to route contract, never embedded stale literals.

- [ ] **Step 4: Re-run full test/build command on final head**

Expected: zero failures.

- [ ] **Step 5: Confirm Render final head is live**

Match Render deploy commit SHA to branch head and confirm startup preflight passed.

- [ ] **Step 6: Update PR #18**

Document verified metrics API, Starter Audit report lifecycle, token security, atomic database function, real HTTP integration test, and remaining prototype limitations. Explicitly state no Vercel.

- [ ] **Step 7: Commit/finish**

Only claim completion after all verification evidence is fresh and matches the final head.
