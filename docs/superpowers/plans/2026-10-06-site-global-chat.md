# Hynoe SMP Global Site Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a secure, persistent, site-wide Global Chat with anonymous guest identity, realtime presence, replies/reactions/reporting, moderation/admin controls, and a shared launcher across Hynoe SMP public pages.

**Architecture:** Keep the existing static site. Add Supabase Auth/Postgres/Realtime/Edge Functions behind shared `assets/site-social.mjs` + `assets/site-social.css`. Visitors use anonymous Supabase auth with Cloudflare Turnstile. Reads are RLS-protected. Message creation goes only through authenticated Edge Function `send-site-message`. Persisted message changes are broadcast on private Realtime topic `site:global` and Presence is used only for online state.

**Tech Stack:** Static HTML/CSS/ES modules, Node.js built-in test runner, Playwright/browser smoke tests, Supabase Auth/Postgres/Realtime/Edge Functions, Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-10-06-site-help-global-chat-design.md` and `docs/superpowers/specs/2026-10-06-site-help-global-chat-self-review.md`

## Global Constraints

- Website-native only; no Minecraft, Bloom, Discord, or `control-bridge/` dependency.
- Guest bootstrap: `supabase.auth.signInAnonymously({ options: { captchaToken } })`.
- Browser uses a Supabase **publishable** key only; privileged secret keys stay in Edge Functions/server paths.
- All exposed-schema tables get RLS plus explicit Data API `GRANT`s.
- Anonymous users use the `authenticated` Postgres role; authorization must use ownership/immutable role data, not `TO authenticated` alone.
- Do not use `user_metadata` for authorization.
- Message body max: 300 chars. Normal guest spacing: minimum 3 seconds. Rate constants centralized.
- Public message creation only through `send-site-message`; browser has no direct insert grant on `site_chat_messages`.
- Realtime topic: private `site:global`; Presence is low-frequency only.
- User content is rendered with safe DOM/text APIs only.
- No secrets in GitHub, query strings, browser storage, or page source.

## Review Focus

1. Anonymous user attempts to self-promote role -> rejected by RLS/server checks.
2. Muted/banned user calls Edge Function directly -> rejected even if UI is bypassed.
3. Duplicate/replayed message requests inside cooldown -> rejected or idempotently handled.
4. Realtime reconnect after missed events -> client refreshes authoritative history without duplicates.
5. Malicious display/message text (`<script>`, bidi/control chars, oversized payload) -> safely normalized/rejected and never injected as HTML.

## File Structure

- `assets/site-social.mjs` — site-wide launcher, auth bootstrap, history, realtime, presence, chat interactions.
- `assets/site-social.css` — desktop/mobile HUD panel, accessibility/reduced-motion states.
- `assets/site-social-core.mjs` — pure validation/state helpers testable in Node.
- `assets/site-social-admin.mjs` — protected moderation/admin UI client.
- `site-admin.html` — admin operations surface.
- `supabase/functions/_shared/site-chat-core.mjs` — pure message/profile/rate-limit helpers testable in Node.
- `supabase/functions/send-site-message/index.ts` — authenticated write endpoint.
- `supabase/functions/moderate-site-chat/index.ts` — authenticated moderator/admin actions.
- `supabase/migrations/*_site_global_chat.sql` — schema, RLS, grants, realtime policies/triggers.
- `tests/site-social-core.test.mjs` — pure frontend behavior.
- `tests/site-chat-function-core.test.mjs` — Edge Function pure-core tests.
- `tests/site-social-browser.mjs` — panel/mobile integration smoke tests.
- `community-rules.html` — public site-chat rules wording.
- `watch.html` — remove obsolete Minecraft-relay chat shell while preserving stream/game features.
- root visitor HTML pages — include shared social assets + required CSP origins.

---

### Task 1: Chat domain rules and pure validation

**Files:**
- Create: `assets/site-social-core.mjs`
- Create: `supabase/functions/_shared/site-chat-core.mjs`
- Create: `tests/site-social-core.test.mjs`
- Create: `tests/site-chat-function-core.test.mjs`

**Interfaces:**
- Produces frontend: `normalizeDisplayName(input)`, `validateDisplayName(input)`, `validateClientMessage(input)`, `computeUnread(state,event)`.
- Produces server: `normalizeMessageBody(input)`, `validateMessageBody(input)`, `canPost(profile,limits,now)`, `validateReplyTarget(reply)`.

- [ ] Write failing tests for 300-char max, blank/control-only rejection, reserved staff names, HTML/script text preservation as text, 3-second cooldown, muted/banned rejection, and unread behavior.
- [ ] Run: `node --test tests/site-social-core.test.mjs tests/site-chat-function-core.test.mjs`; expect failures for missing modules/functions.
- [ ] Implement only the pure helpers above; centralize constants in the server core and export safe client constants where needed.
- [ ] Re-run tests; expect PASS.
- [ ] Commit: `feat: add site chat validation core`.

### Task 2: Supabase schema, RLS, grants, and realtime authorization

**Files:**
- Create migration via Supabase CLI `supabase migration new site_global_chat`.
- Modify generated migration file only.
- Create: `tests/site-chat-schema.sql` or equivalent SQL assertions used by local/connected test flow.

**Interfaces:**
- Produces tables: `site_profiles`, `site_chat_messages`, `site_chat_reactions`, `site_chat_reports`, `site_announcements`, `site_moderation_audit`, `site_chat_settings`.
- Produces safe read view/API for public message history without exposing moderation-only fields.

- [ ] Write security assertions first: guest cannot write role/mute/ban fields, cannot direct-insert messages, cannot delete another message, cannot read reports/audit, and unauthenticated realtime client is denied.
- [ ] Create migration through CLI, then add tables, constraints, indexes, RLS, explicit `GRANT`s, private Realtime policies, and database trigger/broadcast support.
- [ ] Use `security_invoker = true` for any exposed view where supported; otherwise keep it unexposed and query tables through RLS-safe paths.
- [ ] Run schema/security assertions and Supabase advisors; fix findings before commit.
- [ ] Commit: `feat: add secure global chat schema`.

### Task 3: Anonymous auth bootstrap and profile creation

**Files:**
- Modify: `assets/site-social.mjs`
- Modify: `assets/site-social.css`
- Modify migration if a profile bootstrap RPC/trigger is required.
- Test: `tests/site-social-browser.mjs`

**Interfaces:**
- Consumes Supabase URL + publishable key + Turnstile site key from public config.
- Produces `ensureSiteSession()` and `ensureProfile(displayName)`.

- [ ] Add failing browser tests for first-run Turnstile gate, anonymous sign-in, display-name creation, persisted session reload, and graceful auth failure.
- [ ] Implement Supabase client bootstrap and `signInAnonymously({ options: { captchaToken } })`.
- [ ] Ensure profile creation/update cannot set privileged columns.
- [ ] Re-run browser/auth tests; expect PASS.
- [ ] Commit: `feat: add guest site identity`.

### Task 4: Authenticated message creation Edge Function

**Files:**
- Create: `supabase/functions/send-site-message/index.ts`
- Modify: `supabase/functions/_shared/site-chat-core.mjs`
- Test: `tests/site-chat-function-core.test.mjs`

**Interfaces:**
- Endpoint input: `{ body: string, reply_to?: string | null, request_id?: string }`.
- Endpoint output: `{ id: string, created_at: string }` on success; structured non-secret errors otherwise.

- [ ] Add failing tests for missing/invalid JWT context, muted/banned profile, cooldown, oversized message, invalid reply target, paused chat, and valid insert payload.
- [ ] Keep Edge Function JWT verification enabled; derive user from auth token, never caller-supplied ID.
- [ ] Perform privileged database insert only after all checks.
- [ ] Add CORS allowlist for `https://hynoesmp.com` and `https://www.hynoesmp.com` plus explicit approved preview/dev origins.
- [ ] Run unit/function integration tests; expect PASS.
- [ ] Commit: `feat: add controlled site message endpoint`.

### Task 5: History, realtime Broadcast, Presence, and reconnect

**Files:**
- Modify: `assets/site-social.mjs`
- Modify: `assets/site-social-core.mjs`
- Test: `tests/site-social-browser.mjs`

**Interfaces:**
- Produces `loadRecentMessages()`, `connectGlobalChannel()`, `disconnectGlobalChannel()`.

- [ ] Add failing tests for history hydration, live append, dedupe by message ID, missed-event reconnect refresh, unread counter, and online-count changes.
- [ ] Implement private channel `site:global` subscription and low-frequency Presence.
- [ ] On reconnect, refresh authoritative recent history then dedupe before rendering.
- [ ] Ensure subscriptions are removed on teardown/page lifecycle transitions.
- [ ] Re-run tests; expect PASS.
- [ ] Commit: `feat: add realtime global chat`.

### Task 6: Replies, reactions, reporting, announcements

**Files:**
- Modify: `assets/site-social.mjs`
- Modify: `assets/site-social.css`
- Modify migration/RLS for reactions/reports/announcements as required.
- Test: `tests/site-social-core.test.mjs`, `tests/site-social-browser.mjs`

**Interfaces:**
- Produces reply composer state, allowlisted reaction set, report submission, active announcement banner.

- [ ] Add failing tests for valid/invalid reply references, reaction uniqueness, report privacy, announcement expiry, and deleted-message tombstones.
- [ ] Implement UI + safe database/Edge Function paths according to RLS.
- [ ] Re-run tests; expect PASS.
- [ ] Commit: `feat: add global chat interactions`.

### Task 7: Moderation/admin operations

**Files:**
- Create: `site-admin.html`
- Create: `assets/site-social-admin.mjs`
- Create: `supabase/functions/moderate-site-chat/index.ts`
- Modify migration for immutable admin authorization/audit.
- Test: `tests/site-chat-function-core.test.mjs`, browser admin smoke test.

**Interfaces:**
- Admin actions: tombstone message, mute user, ban/unban user, resolve report, pin/unpin announcement, pause/unpause posting.

- [ ] Add failing tests proving anonymous users cannot access admin actions or self-assign roles.
- [ ] Authorize admin/moderator using server-controlled profile/app metadata, never user metadata.
- [ ] Append moderation actions to `site_moderation_audit`.
- [ ] Implement protected admin page without secret keys in browser storage/query params.
- [ ] Re-run tests; expect PASS.
- [ ] Commit: `feat: add site chat moderation`.

### Task 8: Site-wide responsive UI and old relay cleanup

**Files:**
- Modify: `assets/site-social.mjs`, `assets/site-social.css`
- Modify intended root public HTML pages.
- Modify: `watch.html`, `community-rules.html`
- Test: `tests/site-social-browser.mjs`

**Interfaces:**
- Desktop: fixed bottom-right launcher/panel.
- Mobile: accessible bottom sheet; composer remains visible above virtual keyboard.

- [ ] Add failing DOM/browser checks for clear `GLOBAL CHAT` / `ASK HYNOE` labels, keyboard focus, reduced-motion, mobile viewport, no admin-page launcher, and no old Minecraft-relay wording.
- [ ] Add shared versioned asset includes to intended public pages and exact Supabase/Turnstile CSP origins only.
- [ ] Preserve `watch.html` player/game features while removing old relay UI/config dependency.
- [ ] Update community rules for public website chat.
- [ ] Re-run existing site test suite plus social browser tests; expect PASS.
- [ ] Commit: `feat: launch sitewide global chat ui`.

### Task 9: Deployment and production verification

**Files:**
- Add/update setup docs only where required.

**Interfaces:**
- Produces verified live Global Chat independently of Ask Hynoe.

- [ ] Verify Supabase anonymous sign-in + Turnstile configuration and required server secrets without exposing them.
- [ ] Deploy migrations/functions to the connected Supabase project and run security advisors.
- [ ] Deploy preview site branch.
- [ ] Run two-browser realtime smoke test: send/receive, reconnect, persistence, presence, report, moderation propagation.
- [ ] Run secret scan against browser source/bundles/API responses and repository diff.
- [ ] After preview passes, publish site changes and verify live production behavior.
- [ ] Commit any verified configuration/docs fixes: `docs: finalize site global chat rollout`.

## Definition of Done

- Global Chat is clearly visible on intended public pages.
- Two independent visitors can exchange persistent realtime messages without Minecraft/Bloom/Discord.
- Anonymous guest auth + display names work with Turnstile.
- Presence, unread counts, replies, reactions, reports, tombstones, announcements work.
- Moderation/admin controls are server-authorized and audited.
- Direct message-table insert is blocked from browser users.
- Old website-to-Minecraft relay UX is removed.
- Existing site/game/player features remain working.
- No privileged secret is exposed.
- Production smoke tests and security checks pass.
