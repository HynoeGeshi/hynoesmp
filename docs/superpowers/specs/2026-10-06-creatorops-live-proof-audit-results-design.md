# CreatorOps Live Proof + Starter Audit Results Design

## Goal

Fix the two structural gaps found by the first CreatorOps test audit:

1. public Hynoe proof metrics must stop drifting out of date without silently inventing freshness; and
2. a successful creator-audit submission must produce an immediate, useful customer-facing Starter Creator Audit instead of ending at a review-queue confirmation.

The implementation must keep the existing Render → signed Supabase gateway trust boundary, preserve deny-by-default browser access to private CreatorOps data, remain on Render + Supabase + Stripe sandbox, and use no Vercel infrastructure.

## Success criteria

A release is successful when all of the following are true:

- The public Hynoe case-study panel reads its metrics from a server-provided verified snapshot rather than hardcoded HTML values.
- The panel shows when the snapshot was verified and never labels manually refreshed or stale private analytics as live.
- If metric refresh fails, the last verified snapshot stays available with an honest freshness label.
- A valid POST to `/api/intake` stores the application and creates a Starter Creator Audit atomically.
- The intake response returns an opaque report URL and expiry, not an application UUID, report UUID, email address, token hash, or database credential.
- The report URL renders a polished private report with a primary bottleneck, rationale, three prioritized actions, a seven-day action plan, a monetization opportunity, a CreatorOps-handled section, and a recommended next offer.
- Invalid, expired, malformed, revoked, or unknown report tokens do not reveal whether an application exists.
- Browser clients cannot enumerate applications, audit reports, payment events, or private metric records.
- Existing admin authentication, rate limiting, payload limits, spam honeypot behavior, Ed25519 signing, Stripe sandbox flow, CSP, and startup preflight behavior remain intact.
- Automated integration tests exercise an actual HTTP POST against the CreatorOps server and verify intake → report creation → report retrieval.

## Non-goals

This change does not:

- claim to perform a full connected-platform analytics audit for arbitrary creators before OAuth integrations exist;
- scrape private YouTube Studio or other authenticated dashboards;
- expose Windsor.ai credentials or private analytics APIs to the browser;
- enable Stripe live mode;
- send automatic customer email in this iteration;
- replace the human review queue or operator dashboard;
- introduce a general-purpose AI agent or external LLM dependency into the request path;
- configure final `hynoe.net/creatorops` custom-domain routing.

The immediate result is intentionally a high-quality Starter Creator Audit based on validated intake context and deterministic expert rules. Connected analytics can enrich the same report schema later.

## Existing architecture to preserve

Current request path:

`Browser -> Render CreatorOps server -> Ed25519-signed request -> Supabase creatorops-gateway -> locked CreatorOps tables`

Existing controls that remain mandatory:

- browser requests never contain Supabase service credentials;
- Render holds the private Ed25519 signing key;
- the Supabase Edge Function stores only the public verification key;
- application and payment tables are protected from direct browser reads;
- admin routes use separate Basic Auth credentials;
- intake requests are validated, size-limited, honeypot-checked, IP-rate-limited, and user-agent-hashed on Render;
- Stripe checkout remains sandbox only.

The new design extends this architecture rather than creating a second trust path.

## Architecture

### 1. Verified public metric snapshots

Create `public.creatorops_public_metrics` with:

- `id uuid primary key default gen_random_uuid()`
- `snapshot_key text unique not null`
- `source text not null`
- `verification_mode text not null check (verification_mode in ('manual_verified','automated_verified'))`
- `as_of timestamptz not null`
- `verified_at timestamptz not null default now()`
- `metrics jsonb not null`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The first row is `hynoe_youtube_case_study` with `verification_mode='manual_verified'` and this verified snapshot from the October 6, 2026 Windsor/YouTube pull:

```json
{
  "subscribers": 544,
  "views_30d": 2349,
  "watch_minutes_30d": 12762,
  "watch_hours_30d": 212.7,
  "likes_30d": 122,
  "comments_30d": 36,
  "shares_30d": 23,
  "subscribers_gained_30d": 8,
  "subscribers_lost_30d": 3,
  "net_subscribers_30d": 5
}
```

`source='youtube_via_windsor_verified_snapshot'` and `as_of='2026-10-06T21:06:30Z'`.

RLS is enabled. `anon` and `authenticated` get no table policy that permits direct reads or writes.

The signed Supabase gateway gets a `public-metrics` operation that accepts no arbitrary table/key input from the browser. It returns only the allow-listed public shape for `hynoe_youtube_case_study`.

Render exposes `GET /api/public/metrics/hynoe-youtube`. No generic public metrics endpoint is added.

### 2. Metric freshness semantics

Render derives the public `freshness` label from both `verification_mode` and snapshot age. The stale threshold is 7 days.

- `fresh`: only when `verification_mode='automated_verified'` and the snapshot is <= 7 days old.
- `verified_snapshot`: when `verification_mode='manual_verified'` and the snapshot is <= 7 days old.
- `stale_verified_snapshot`: any verified snapshot older than 7 days.

A manual snapshot can therefore never be called live/fresh merely because it was recently inserted.

Public response:

```json
{
  "ok": true,
  "key": "hynoe_youtube_case_study",
  "source": "youtube_via_windsor_verified_snapshot",
  "asOf": "2026-10-06T21:06:30.000Z",
  "verifiedAt": "...",
  "freshness": "verified_snapshot",
  "metrics": { "...": "allow-listed values only" }
}
```

The UI always displays `as of <date>` and appropriate verified/stale copy. It must never display `live`, `real-time`, or equivalent language unless the backend returns `fresh` under the rule above.

If the metrics endpoint is unavailable, the proof section keeps its explanatory copy but replaces numeric proof with a neutral `Verified metrics temporarily unavailable` state. Static HTML must not contain fallback hardcoded performance values.

### 3. Starter Creator Audit storage

Create `public.creatorops_audit_reports` with:

- `id uuid primary key default gen_random_uuid()`
- `application_id uuid not null references public.creatorops_applications(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `expires_at timestamptz not null`
- `report_version integer not null default 1`
- `report jsonb not null`
- `token_hash text unique not null`
- `status text not null default 'ready' check (status in ('ready','superseded','revoked'))`

RLS is enabled. Browser roles receive no direct access.

Render generates the raw report token with at least 192 bits of cryptographic entropy and URL-safe encoding. Render hashes it with SHA-256 before sending any persistent token material to Supabase. Only `token_hash` is stored. The raw token exists only in the successful intake response and the customer URL.

The raw token must contain no UUID, email, creator name, timestamp, revenue value, or reversible identifier. Default report expiry is 30 days.

### 4. Starter audit report schema

Version 1 stores:

```json
{
  "version": 1,
  "creator": {
    "display_name": "...",
    "primary_platform": "...",
    "profile_url": "..."
  },
  "summary": "...",
  "primary_bottleneck": {
    "code": "packaging",
    "label": "Packaging & discovery",
    "why_it_matters": "..."
  },
  "priority_actions": [
    {
      "rank": 1,
      "title": "...",
      "reason": "...",
      "next_step": "..."
    }
  ],
  "seven_day_plan": [
    { "day": 1, "action": "..." }
  ],
  "monetization_opportunity": {
    "title": "...",
    "explanation": "..."
  },
  "creatorops_can_handle": ["..."],
  "recommended_offer": {
    "code": "free_audit|system_build|founding_creatorops",
    "title": "...",
    "reason": "..."
  },
  "limitations": [
    "This starter audit is based on the information submitted and does not yet include private connected-platform analytics."
  ]
}
```

`priority_actions` contains exactly 3 items. `seven_day_plan` contains exactly 7 items.

The report deliberately excludes email, revenue bracket, internal application status, IP/user-agent data, application/report IDs, and token hashes.

### 5. Deterministic audit engine

Create `creatorops/audit-engine.mjs` with no HTTP/database dependencies.

Inputs:

- primary platform;
- stated 90-day goal;
- stated biggest bottleneck;
- revenue bracket;
- selected interest/offer;
- profile URL domain/type.

Classification categories:

- `packaging`
- `operations`
- `monetization`
- `consistency`
- `positioning`

The engine scores categories using explicit keyword and structured-field rules. Ties use a fixed documented priority order so identical input produces identical output.

Copy templates are category-specific and platform-aware. They must not fabricate metrics, imply private analytics were inspected, claim competitor findings not actually gathered, promise growth/revenue, or state that a submitted URL was deeply analyzed when it was not.

The Starter Audit should provide useful next actions while clearly identifying its limitation. A later connected-data audit can enrich this same schema without changing HTTP consumers.

### 6. Atomic application + report write

Render continues receiving `POST /api/intake` and performs the existing validation, honeypot, payload, URL/email, and rate-limit checks before generating a report.

For a valid request Render creates:

- validated application data;
- deterministic report body;
- raw opaque report token;
- SHA-256 `token_hash`;
- 30-day `expires_at`.

Render sends one signed gateway operation: `intake-with-report`.

The Supabase migration must create a named Postgres function:

`public.creatorops_create_or_rotate_audit(...)`

This function is the only path used by the gateway for intake persistence. It executes inside one Postgres transaction and does all of the following atomically:

1. look for the same normalized email within the existing 10-minute duplicate window;
2. when no duplicate exists, insert `creatorops_applications` and its `creatorops_audit_reports` row together;
3. when a duplicate exists and has a ready report, update that report with the newly generated report body, new `token_hash`, new `expires_at`, and `report_version=1` rather than creating another application;
4. when a duplicate exists but no ready report exists, create the missing ready report for that application;
5. return only `duplicate boolean` and success metadata required by the gateway, never the stored token hash.

The function is `SECURITY DEFINER`, sets a safe fixed `search_path`, and has execute permission revoked from `public`, `anon`, and `authenticated`. It is called only through the Supabase service-role context inside the verified Edge Function.

Because duplicate submission rotates `token_hash`, any prior report URL for that duplicate application becomes invalid. The browser receives only the newly generated raw token from Render.

Successful Render response:

```json
{
  "ok": true,
  "duplicate": false,
  "report": {
    "url": "/creatorops/report/<opaque-token>",
    "expiresAt": "..."
  }
}
```

The browser never receives application/report UUIDs, token hashes, or database metadata.

### 7. Private report retrieval

Add `GET /api/report/:token`.

Render:

1. validates a strict token syntax/length;
2. uses a separate report-read IP rate-limit bucket;
3. hashes the raw token;
4. sends signed gateway operation `report-read` with only the token hash.

The gateway queries a ready, non-expired report by exact hash and returns only the public report shape.

Unknown, malformed, expired, revoked, and superseded tokens all produce the same generic 404 response. The API must not reveal whether the associated application exists.

Backend/gateway unavailability produces a generic 503 `report_temporarily_unavailable` rather than a false invalid-token response.

Add `GET /creatorops/report/:token`, which serves a static same-origin report shell. `report.js` extracts the token from the URL and calls `/api/report/:token`.

Private report responses use:

- `Cache-Control: no-store`
- `X-Robots-Tag: noindex, nofollow, noarchive`

`report.html` includes equivalent robots metadata.

Dynamic report content is rendered with safe DOM APIs (`textContent`, element creation), never by interpolating submitted/user-derived strings into `innerHTML`.

### 8. Main-site submission UX

On successful intake + report creation:

- status becomes `Your Starter Creator Audit is ready.`;
- a primary `View my audit` button uses the returned same-origin report URL;
- the application summary remains available as a secondary fallback;
- Stripe sandbox checkout is still offered only when the submitted interest matches a sandbox offer;
- the session draft is cleared only after the report was successfully persisted and returned.

If the atomic write fails, the request is unsuccessful and the draft remains in the tab.

### 9. Admin behavior

The existing admin application dashboard remains the source of truth for human follow-up.

`admin-list` may include only these additional report fields:

- `audit_status`: `ready|expired|revoked|missing`
- `audit_created_at`
- `audit_expires_at`

Admin APIs do not return raw report tokens or token hashes. Issuing a replacement report link from admin is outside this iteration.

### 10. Future automated metric refresh hook

This design supports automated refresh without pretending credentials exist today.

A future trusted backend job can submit verified analytics via signed operation `metrics-upsert`. Browser clients cannot call it directly. The operation can mark snapshots `automated_verified` only when the data came from an authenticated upstream analytics integration.

Until a server-side Windsor/YouTube credential exists, the Hynoe snapshot remains `manual_verified` and is refreshed only through a trusted operator process.

## Data migration

The additive migration creates:

1. `creatorops_public_metrics`;
2. `creatorops_audit_reports`;
3. indexes for `snapshot_key`, `token_hash`, `application_id`, and `expires_at`;
4. RLS on both tables with no permissive browser policies;
5. the foreign key from report to application with cascade delete;
6. `public.creatorops_create_or_rotate_audit(...)` with locked execute permissions and safe `search_path`;
7. the initial verified Hynoe YouTube snapshot.

No existing CreatorOps table is dropped and no existing RLS is loosened.

## Files and responsibility boundaries

Expected implementation units:

- `creatorops/server.mjs` — HTTP routing, validation, abuse controls, token generation/hashing, signed gateway calls, metrics/report endpoints.
- `creatorops/audit-engine.mjs` — deterministic classification and report generation only.
- `creatorops/creatorops.js` — public metric hydration and intake success/report CTA behavior.
- `creatorops/report.html` — static private report shell.
- `creatorops/report.js` — token extraction, report retrieval, safe DOM rendering.
- `creatorops/creatorops.css` — report presentation and proof freshness states.
- `tests/creatorops-audit-engine.test.mjs` — deterministic generator contract.
- `tests/creatorops-integration.test.mjs` — actual HTTP intake/report lifecycle through an injectable fake gateway.
- `tests/creatorops-mvp.test.mjs` — existing security/public contract plus updated proof/report UI contract.
- Supabase migration — tables, indexes, RPC, permissions, verified metric seed.
- `creatorops-gateway` — signed `intake-with-report`, `report-read`, `public-metrics`, and admin report metadata operations.

The audit engine stays independent of HTTP/database code so connected analytics can later enrich it without route rewrites.

## Security requirements

The release must preserve or add all of the following:

- no Vercel dependency;
- no Supabase service key in client assets;
- no analytics connector credential in client assets;
- no raw report token stored in the database;
- no PII encoded in report URLs;
- at least 192 bits of report-token entropy;
- no application/report enumeration endpoint;
- private report URLs expire after 30 days and are noindex;
- generic 404 behavior for unknown/expired/revoked/superseded/malformed tokens;
- separate report-read and intake rate-limit buckets;
- report/API responses use `Cache-Control: no-store` where private data is involved;
- dynamic report text uses safe DOM APIs;
- public metric fields are allow-listed server-side;
- public metrics expose no account IDs, connector IDs, emails, tokens, or internal notes;
- a manual metric snapshot can never be labeled `fresh`;
- Ed25519 request timestamp tolerance remains enforced;
- database browser roles remain deny-by-default;
- the new atomic Postgres function cannot be executed by browser roles;
- admin auth remains separate from report access;
- existing strict CSP remains in force with same-origin assets only.

## Error handling

### Intake

- malformed JSON -> 400
- unsupported content type -> 415
- invalid fields -> 422
- payload too large -> 413
- rate limit -> 429 + `Retry-After`
- honeypot -> existing quiet-success behavior, no gateway write and no real report URL
- gateway/database/atomic write failure -> 502 or appropriate upstream failure; browser draft remains

### Report

- malformed/unknown/expired/revoked/superseded token -> identical generic 404
- gateway unavailable -> 503 `report_temporarily_unavailable`

### Public metrics

- snapshot available -> 200 with allow-listed snapshot + freshness semantics
- no usable snapshot -> 503
- browser fetch failure -> neutral unavailable proof state, never hardcoded stale numbers

## Testing strategy

### Audit-engine unit tests

Must prove:

- same input produces identical report body;
- every classification category can win;
- tie-breaking is deterministic;
- exactly 3 priority actions;
- exactly 7 plan days;
- revenue/interest can influence recommended offer without guaranteed-income claims;
- HTML/script-like user strings remain data and are never treated as markup.

### HTTP integration tests

Start `createCreatorOpsServer()` on an ephemeral local port with an injectable fake gateway and make real HTTP requests.

Required cases:

1. valid `POST /api/intake` returns safe report URL + expiry;
2. fake gateway receives one `intake-with-report` operation containing application + report + hash, not raw token;
3. `GET /api/report/:token` returns the public report;
4. malformed/unknown report token -> generic 404;
5. expired/revoked report -> generic 404;
6. duplicate intake rotates token: old link fails, new link succeeds;
7. honeypot returns quiet success with no gateway write;
8. repeated intake -> 429;
9. oversized intake -> 413;
10. public metrics endpoint returns only allow-listed fields and freshness metadata;
11. manual metrics never return `fresh`;
12. metrics unavailable -> 503;
13. admin routes still require Basic Auth.

### Database tests/verification

Verify:

- anon/authenticated cannot select either new table;
- anon/authenticated cannot execute `creatorops_create_or_rotate_audit`;
- failed report insert rolls back new application insert;
- duplicate submission updates the existing report token hash atomically;
- no raw token exists in either table.

### Build/deploy contract

Render build must fail if:

- report routes disappear;
- report responses become indexable/cacheable;
- token hash/raw-token boundary regresses;
- public static HTML reintroduces hardcoded case-study metrics;
- manual snapshots can be labeled fresh;
- security headers disappear;
- signed backend preflight fails.

Existing CreatorOps tests must remain green.

## Rollout

1. Apply the additive Supabase migration and seed the verified Hynoe snapshot.
2. Deploy updated signed gateway operations.
3. Deploy Render code on the existing CreatorOps branch/service.
4. Run the full build/security suite.
5. Run a labeled TEST audit through the live HTTP intake route.
6. Open the returned opaque report URL and verify the rendered Starter Audit.
7. Verify the old token fails after a duplicate test submission rotates the token.
8. Verify public proof displays the seeded values with an `as of` date and `verified snapshot` semantics.
9. Verify an invalid token returns the same generic 404 behavior.
10. Remove the labeled TEST application/report after verification.
11. Keep Stripe in sandbox mode.

## Acceptance audit

Before completion, verify:

- public case-study numbers match the verified snapshot;
- proof visibly states when the values were verified;
- old hardcoded metric values are absent from static HTML;
- a real HTTP POST produces a real private report;
- report output contains no email, revenue bracket, internal IDs, or token hash;
- the report link is opaque and cannot be derived from submitted data;
- direct browser-role Supabase reads remain blocked;
- browser roles cannot execute the new atomic RPC;
- admin still works;
- existing Stripe sandbox checkout/webhook behavior is unchanged;
- Render logs show successful build, startup preflight, and live deploy;
- no Vercel service, deployment, URL, or configuration is introduced.
