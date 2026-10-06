# CreatorOps Live Proof + Starter Audit Results Design

## Goal

Fix the two structural gaps found by the first CreatorOps test audit:

1. public Hynoe proof metrics must stop drifting out of date without silently inventing freshness; and
2. a successful creator-audit submission must produce an immediate, useful customer-facing Starter Creator Audit instead of ending at a review-queue confirmation.

The implementation must keep the existing Render → signed Supabase gateway trust boundary, preserve deny-by-default browser access to private CreatorOps data, remain on Render + Supabase + Stripe sandbox, and use no Vercel infrastructure.

## Success criteria

A release is successful when all of the following are true:

- The public Hynoe case-study panel reads its metrics from a server-provided verified snapshot rather than hardcoded HTML values.
- The panel shows when the snapshot was verified and never labels stale/private analytics as live.
- If metric refresh fails, the last verified snapshot stays available with an honest freshness label.
- A valid POST to `/api/intake` stores the application and creates a Starter Creator Audit in the same protected backend flow.
- The intake response returns an opaque report token and report URL, not an application UUID, email address, or database credential.
- The report URL renders a polished private report with a primary bottleneck, rationale, three prioritized actions, a seven-day action plan, a monetization opportunity, a CreatorOps-handled section, and a recommended next offer.
- Invalid, expired, malformed, or unknown report tokens do not reveal whether an application exists.
- Browser clients cannot enumerate applications, audit reports, payment events, or private metrics.
- Existing admin authentication, rate limiting, payload limits, spam honeypot behavior, Ed25519 signing, Stripe sandbox flow, CSP, and startup preflight behavior remain intact.
- Automated integration tests exercise an actual HTTP POST against the CreatorOps server and verify the intake → report creation → report retrieval flow.

## Non-goals

This change does not:

- claim to perform a full connected-platform analytics audit for arbitrary creators before OAuth integrations exist;
- scrape private YouTube Studio or other authenticated dashboards;
- expose Windsor.ai credentials or private analytics APIs to the browser;
- enable Stripe live mode;
- send automatic customer email in this iteration;
- replace the human review queue or operator dashboard;
- introduce a general-purpose AI agent or external LLM dependency into the request path;
- configure the final `hynoe.net/creatorops` custom-domain routing.

The immediate audit is intentionally a high-quality Starter Creator Audit based on validated intake context and deterministic expert rules. Connected analytics can enrich the same report schema later.

## Existing architecture to preserve

Current request path:

`Browser -> Render CreatorOps server -> Ed25519-signed request -> Supabase creatorops-gateway -> locked CreatorOps tables`

Important existing controls:

- browser requests never contain Supabase service credentials;
- Render holds the private Ed25519 signing key;
- the Supabase Edge Function stores only the public verification key;
- application and payment tables are protected from direct browser reads;
- admin routes use separate Basic Auth credentials;
- intake requests are validated, size-limited, honeypot-checked, IP-rate-limited, and user-agent-hashed on Render;
- Stripe checkout remains sandbox only.

The new design extends this architecture instead of creating a second trust path.

## Architecture

### 1. Verified public metric snapshots

Create a Supabase table `creatorops_public_metrics` containing named verified metric snapshots. The first snapshot is `hynoe_youtube_case_study`.

Fields:

- `id uuid primary key`
- `snapshot_key text unique not null`
- `source text not null`
- `as_of timestamptz not null`
- `verified_at timestamptz not null default now()`
- `metrics jsonb not null`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

For `hynoe_youtube_case_study`, `metrics` uses this stable shape:

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

The initial snapshot is seeded from the verified Windsor/YouTube pull performed on October 6, 2026. `source` is `youtube_via_windsor_verified_snapshot`.

RLS remains enabled. Browser roles get no table access.

The signed Supabase gateway gets a new `public-metrics` operation that returns only an allow-listed public shape for a known `snapshot_key`. The Render server exposes `GET /api/public/metrics/hynoe-youtube` without admin auth and forwards only the allow-listed response. No generic arbitrary-key public metric endpoint is introduced.

### 2. Freshness semantics

The public API returns:

```json
{
  "ok": true,
  "key": "hynoe_youtube_case_study",
  "source": "youtube_via_windsor_verified_snapshot",
  "asOf": "2026-10-06T21:06:30.000Z",
  "verifiedAt": "...",
  "freshness": "verified_snapshot",
  "metrics": { ...allow-listed metrics... }
}
```

The UI always displays an `as of` date.

Freshness labels:

- `verified_snapshot`: the latest known verified values; this is the default until a server-side analytics credential is connected.
- `fresh`: reserved for a future automated refresh completed within the configured freshness window.
- `stale_verified_snapshot`: the snapshot is older than the configured freshness threshold but is still the last verified value.

The initial stale threshold is 7 days. The site must never display `live`, `real-time`, or equivalent language unless the backend explicitly returns `fresh` from an authenticated upstream refresh.

If `/api/public/metrics/hynoe-youtube` fails, the UI falls back to a neutral case-study state that says the verified metrics are temporarily unavailable. It does not inject old hardcoded numbers from HTML.

### 3. Starter Creator Audit storage

Create a table `creatorops_audit_reports`.

Fields:

- `id uuid primary key`
- `application_id uuid not null references creatorops_applications(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `expires_at timestamptz not null`
- `report_version integer not null default 1`
- `report jsonb not null`
- `token_hash text unique not null`
- `status text not null default 'ready' check (status in ('ready','superseded','revoked'))`

RLS remains enabled. Browser roles get no direct access.

A raw report token is generated on Render using cryptographically secure random bytes. Only its SHA-256 hash is stored in Supabase. The raw token is returned once in the intake response and used in the customer report URL.

Token requirements:

- at least 192 bits of entropy;
- URL-safe representation;
- no application UUID, email address, creator name, timestamp, or reversible identifier embedded in it;
- default expiration: 30 days;
- constant-time hash comparison where applicable;
- report retrieval returns the same generic 404 response for unknown, expired, revoked, malformed, or valid-but-unavailable tokens.

### 4. Starter audit report schema

Version 1 stores this stable report shape:

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
    {
      "day": 1,
      "action": "..."
    }
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

### 5. Deterministic report generation

The first version uses deterministic expert rules on the Render server. It must not require an external AI/LLM call to complete intake.

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

The generator scores these categories using explicit keyword and structured-field rules, then chooses the highest score. Ties use a fixed priority order so repeated identical input yields identical reports.

Rules must be isolated in a dedicated module rather than embedded in route handlers. Copy templates are category-specific and platform-aware, but must avoid fabricating performance metrics, competitor claims, guaranteed growth, or claims that the profile itself was deeply analyzed when it was not.

The report should be useful enough to stand alone but deliberately leave room for a deeper human/connected-data audit.

### 6. Intake transaction behavior

The public browser continues posting to `POST /api/intake`.

Render performs the existing validation and anti-abuse checks first. It then generates:

- the validated application payload;
- the deterministic Starter Creator Audit;
- a cryptographically random raw report token;
- the SHA-256 token hash;
- a 30-day expiration timestamp.

Render sends one signed `intake-with-report` operation to the Supabase gateway.

The gateway performs application de-duplication first. For a new application it inserts the application and report in one database transaction/RPC-equivalent atomic operation so the system never returns success with an application stored but no report.

For a duplicate submission inside the existing 10-minute duplicate window, the backend returns the existing ready report for that duplicate application only if it can do so without storing or returning the previous raw token. Because only token hashes are stored, the safe behavior is to generate a new report token, rotate the stored token hash for the existing report, and return the new token. The previous report link becomes invalid.

Successful response shape:

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

The browser never receives `application_id`, `report_id`, token hash, email echo, or database metadata.

### 7. Private report retrieval

Add:

`GET /api/report/:token`

Render validates token syntax and rate-limits report retrieval separately from intake. It hashes the token and sends a signed `report-read` operation to the Supabase gateway.

The gateway returns the report only when:

- token hash matches exactly;
- status is `ready`;
- `expires_at` is in the future.

Returned public report data omits application email, revenue bracket, internal status, user-agent hash, application ID, report ID, and token hash.

Add:

`GET /creatorops/report/:token`

This serves a static report shell. Client JavaScript extracts the token from the route and requests `/api/report/:token`. The report page uses the same CreatorOps visual language as the main site and clearly states the starter-audit limitation.

The report page contains no indexing value. Response headers include `X-Robots-Tag: noindex, nofollow, noarchive` and the HTML contains matching robots metadata.

### 8. Main-site submission UX

After a successful intake response:

- replace the old “in review queue” terminal state with “Your Starter Creator Audit is ready.”;
- show a primary button `View my audit` using the returned report URL;
- keep the sandbox checkout CTA only when the submitted interest maps to a sandbox offer;
- keep the copyable application summary as a secondary fallback;
- clear the session draft only after intake + report creation succeeds.

If report creation fails atomically, the submission is treated as unsuccessful and the draft remains in the tab.

### 9. Admin behavior

The existing operator dashboard remains the source of truth for human follow-up.

The admin application list gains only the minimum report metadata needed for operations:

- `audit_status`: ready / expired / revoked / missing
- `audit_created_at`
- `audit_expires_at`

The admin API does not return raw report tokens. A future “issue new report link” action is outside this iteration.

### 10. Future automated analytics refresh hook

The design supports automated metric refresh but does not pretend it exists before credentials exist.

A future authenticated backend job may call a signed `metrics-upsert` operation with a verified payload from Windsor.ai, YouTube Analytics, or another approved connector. That operation must remain unavailable to browsers and require the existing signed Render/backend trust path or an equally strong server-side credential.

Until such a credential exists on the server, metrics are refreshed manually through a trusted operator process and retain `verified_snapshot` semantics.

## Data migrations

Migration creates:

1. `creatorops_public_metrics`
2. `creatorops_audit_reports`
3. indexes on:
   - `creatorops_public_metrics(snapshot_key)`
   - `creatorops_audit_reports(token_hash)`
   - `creatorops_audit_reports(application_id)`
   - `creatorops_audit_reports(expires_at)`
4. RLS enabled on both tables
5. no anon/authenticated read policies
6. foreign key from report to application with cascade delete
7. the initial verified Hynoe YouTube metric snapshot

No existing CreatorOps table is dropped or loosened.

## Files and responsibility boundaries

Expected implementation units:

- `creatorops/server.mjs`
  - HTTP routing, validation, abuse controls, signed gateway calls, public/report endpoints.
- `creatorops/audit-engine.mjs`
  - deterministic classification and report generation only.
- `creatorops/creatorops.js`
  - main-page metric hydration and intake success/report CTA behavior.
- `creatorops/report.html`
  - static private report shell.
- `creatorops/report.js`
  - token extraction, report retrieval, safe DOM rendering.
- `creatorops/creatorops.css`
  - report-page presentation additions and metric freshness states.
- `tests/creatorops-audit-engine.test.mjs`
  - deterministic generator tests.
- `tests/creatorops-integration.test.mjs`
  - actual HTTP intake/report lifecycle tests using an injectable/mock gateway boundary.
- `tests/creatorops-mvp.test.mjs`
  - existing public/security contract plus updated proof/report UI contract.
- Supabase migration
  - tables, constraints, indexes, seed snapshot.
- `creatorops-gateway` Edge Function
  - signed operations: `intake-with-report`, `report-read`, `public-metrics`, admin report metadata.

The report generator must remain independent of HTTP and database code so later connected analytics can enrich it without rewriting route logic.

## Security requirements

The change must preserve or add all of these properties:

- no Vercel dependency;
- no Supabase service key in client assets;
- no analytics connector credentials in client assets;
- no raw report token stored in the database;
- no PII encoded in report URLs;
- no application enumeration endpoint;
- report URLs are noindex and expire after 30 days;
- same generic missing response for invalid/expired/revoked/unknown report tokens;
- report API has its own rate-limit bucket;
- report JSON responses use `Cache-Control: no-store`;
- private report HTML is not shared-cacheable;
- all dynamic report text is inserted with safe DOM APIs (`textContent`), not interpolated into `innerHTML`;
- public metric fields are allow-listed server-side;
- public metrics expose no account IDs, connector IDs, emails, tokens, or internal notes;
- Ed25519 request timestamp tolerance remains enforced;
- database browser roles remain deny-by-default;
- admin auth remains separate from report access;
- existing CSP stays strict and is extended only if the report page requires same-origin assets already permitted.

## Error handling

### Intake

- malformed JSON: 400
- wrong content type: 415
- invalid fields: 422
- rate limit: 429 with `Retry-After`
- honeypot trigger: existing quiet-success behavior remains, but no application/report is created
- gateway/database failure: 502/appropriate upstream error; browser keeps its session draft
- application/report atomic failure: no partial success is returned

### Report

- invalid token syntax: 404 generic response
- unknown token: 404 generic response
- expired token: 404 generic response
- revoked token: 404 generic response
- report backend unavailable: 503 generic temporary-unavailable response; do not misrepresent it as an invalid token

### Public metrics

- verified snapshot available: 200
- no snapshot available: 503 with generic unavailable response
- client fetch failure: render the proof section without numbers and with a temporary-unavailable message

## Testing strategy

### Unit tests

Audit engine tests must cover:

- same input produces identical report body;
- each classification category can win;
- tie-breaking is deterministic;
- report contains exactly 3 priority actions and 7 plan days;
- revenue/interest influence the recommended offer without creating guaranteed-income claims;
- malicious HTML-like user input remains plain data and is not turned into report markup.

### HTTP integration tests

Start `createCreatorOpsServer()` on an ephemeral local port with an injectable fake gateway and make actual HTTP requests.

Required cases:

1. valid `POST /api/intake` -> 201/200 success -> response contains only safe report URL + expiry;
2. fake gateway records a corresponding stored application + report request;
3. `GET /api/report/:token` -> report returned;
4. invalid report token -> generic 404;
5. expired token -> generic 404;
6. duplicate intake -> token rotation behavior -> old link invalid, new link valid;
7. honeypot -> quiet success but no gateway write;
8. repeated requests -> 429;
9. oversized intake -> 413;
10. public metrics endpoint returns only allow-listed fields and freshness metadata;
11. public metrics unavailable -> 503;
12. admin routes still require Basic Auth.

### Build/deploy contract

Render build must fail if:

- report routes disappear;
- private report is cacheable/indexable;
- token hashes/raw-token boundaries regress;
- public metric HTML returns to hardcoded case-study values;
- security headers disappear;
- signed backend preflight fails.

Existing CreatorOps tests remain green.

## Rollout

1. Apply the additive Supabase migration and seed the verified Hynoe snapshot.
2. Deploy the updated signed gateway operations.
3. Deploy Render code behind the same CreatorOps service/branch.
4. Run the full build/security suite.
5. Run an end-to-end labeled TEST audit through the live intake endpoint.
6. Verify the report page can be opened with its opaque token.
7. Verify invalid/expired token behavior and public metric freshness display.
8. Remove the labeled TEST application/report from the database after verification.
9. Keep Stripe in sandbox mode.

## Acceptance audit

Before calling the feature complete, verify:

- public case-study numbers match the seeded verified snapshot;
- the page visibly says when those numbers were verified;
- the old hardcoded values are absent from static HTML;
- a real HTTP POST produces a real private report;
- the report includes no email/revenue/internal IDs;
- the report link is opaque and not guessable from application data;
- direct anon/authenticated Supabase reads remain blocked;
- admin still works;
- existing Stripe sandbox checkout/webhook behavior is unchanged;
- Render logs show successful build, startup preflight, and live deploy;
- no Vercel service, deployment, URL, or configuration is introduced.
