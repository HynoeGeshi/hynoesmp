# Hynoe SMP Global Site Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a secure, persistent, site-wide Global Chat with anonymous guest identity, realtime presence, replies/reactions/reporting, moderation/admin controls, and a shared launcher that works across Hynoe SMP public pages without any Minecraft, Bloom, Discord, or control-bridge dependency.

**Architecture:** Keep the existing static site and add Supabase Auth/Postgres/Realtime/Edge Functions behind a shared `assets/site-social.mjs` UI shell. Visitors authenticate anonymously through Supabase with Cloudflare Turnstile, reads use explicitly granted + RLS-protected Data API access, all message creation goes through the authenticated `send-site-message` Edge Function, and database changes broadcast over the private `site:global` Realtime topic.

**Tech Stack:** Static HTML/CSS/ES modules, Node.js built-in test runner, Supabase Auth/Postgres/Realtime/Edge Functions, Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-10-06-site-help-global-chat-design.md` plus `docs/superpowers/specs/2026-10-06-site-help-global-chat-self-review.md`

## Global Constraints

- Global Chat is website-native; no Minecraft, Bloom, Discord, or `control-bridge/` dependency.
- Guest bootstrap uses `supabase.auth.signInAnonymously({ options: { captchaToken } })` with Cloudflare Turnstile.
- Public message creation uses one authenticated Supabase Edge Function named `send-site-message`; browsers do not get direct insert permission on `site_chat_messages`.
- Message body limit is 300 characters and normal guest minimum spacing is 3 seconds; centralize rate constants.
- Realtime topic is private `site:global`; Presence is only for low-frequency online state.
- All exposed-schema tables have RLS plus explicit `GRANT` statements because Supabase Data API auto-exposure is no longer a safe assumption.
- Never use `user_metadata` for authorization; admin/moderator role must come from immutable server-controlled data.
- Do not modify objects in the `realtime` schema; only create the supported RLS policies on `realtime.messages`.
- Use a browser-safe Supabase publishable key only; privileged `sb_secret_*` credentials remain Edge-Function/server-side only.
- Site must remain usable when Supabase is unavailable.
- Preserve existing stream/mining-game behavior on `watch.html` while removing the obsolete website-to-Minecraft chat concept.

## Review Focus

- A guest clears storage or opens a second browser: a new identity is created cleanly and cannot inherit the previous identity's moderation/admin state.
- A muted/banned user calls the Edge Function directly instead of using the UI: server-side policy rejects the send.
- A malicious message/display name contains HTML/script/control characters: rendering remains text-only and message validation rejects unsafe payload forms.
- Realtime disconnects and reconnects while messages are posted: history reconciliation does not duplicate or lose visible messages and unread state remains sane.
- A guest attempts to self-promote by changing profile role fields or forged JWT metadata: RLS/server authorization denies the change.

---

### Task 1: Supabase project layout, schema, grants, and RLS foundation

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/<generated>-site_global_chat.sql`
- Create: `supabase/tests/site_global_chat_rls.sql`
- Create: `tests/site-social-schema.test.mjs`

**Interfaces:**
- Consumes: approved database model from the spec.
- Produces: tables `site_profiles`, `site_chat_messages`, `site_chat_reactions`, `site_chat_reports`, `site_announcements`, `site_moderation_audit`, plus a safe read view/API for chat history and helper authorization functions in a non-exposed schema where privileged logic is required.

- [ ] **Step 1: Write the failing repository-structure test**

Create `tests/site-social-schema.test.mjs` asserting that the migration contains all required table names, `enable row level security`, explicit `grant select`/`grant insert` statements where client Data API access is intended, and contains no `grant all` to `anon` or `authenticated`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/site-social-schema.test.mjs`
Expected: FAIL because the Supabase migration does not exist.

- [ ] **Step 3: Initialize Supabase files and generate the migration filename with the CLI**

Run `supabase --version`, `supabase --help`, `supabase migration new site_global_chat`, and keep the CLI-generated migration filename. Do not invent a timestamp filename manually.

- [ ] **Step 4: Implement the schema, constraints, explicit grants, and RLS policies**

Required policy behavior: authenticated guests can read public history/profile-safe fields; guests cannot change `role`, mute/ban fields, or delete arbitrary messages; reactions are owned by `(auth.uid(), message_id)` and limited to the allowlist; reports are creatable by their reporter but readable/resolvable only by moderators/admins; announcements/audit writes are privileged only.

- [ ] **Step 5: Add SQL security tests**

`supabase/tests/site_global_chat_rls.sql` must exercise the Review Focus cases for self-promotion and cross-user deletion plus muted/banned posting preconditions exposed to the Edge Function.

- [ ] **Step 6: Run local database verification**

Run the current CLI help for local DB/testing commands first, then start/reset the local Supabase stack and execute the SQL tests. Expected: schema applies cleanly and every security assertion passes.

- [ ] **Step 7: Run Supabase advisors before committing**

Run the current Security/Performance Advisor command supported by the installed CLI or Supabase MCP. Expected: no unresolved critical RLS/security finding introduced by these objects.

- [ ] **Step 8: Commit**

```bash
git add supabase tests/site-social-schema.test.mjs
git commit -m "feat: add secure global chat schema"
```

### Task 2: Guest bootstrap, display-name rules, and browser-safe Supabase client

**Files:**
- Create: `assets/site-social-auth.mjs`
- Create: `assets/site-social-validation.mjs`
- Create: `data/site-social-config.json`
- Create: `tests/site-social-auth.test.mjs`
- Create: `tests/site-social-validation.test.mjs`

**Interfaces:**
- Consumes: Supabase project URL + browser-safe publishable key + Turnstile site key from `data/site-social-config.json`.
- Produces: `bootstrapGuest({ captchaToken, displayName })`, `getCurrentSiteUser()`, `normalizeDisplayName(name)`, `validateDisplayName(name)`, `validateChatBody(body)`.

- [ ] **Step 1: Write failing validation tests**

Assert: display names trim/collapse whitespace; reserved Hynoe/staff names are rejected for guests; empty/control-only names fail; chat bodies over 300 characters fail; `<script>` is treated as text/unsafe input and never returned as trusted HTML.

- [ ] **Step 2: Run validation tests to verify RED**

Run: `node --test tests/site-social-validation.test.mjs`
Expected: FAIL because validation module does not exist.

- [ ] **Step 3: Implement pure validation helpers**

Keep every helper DOM-independent so Node tests can exercise it directly.

- [ ] **Step 4: Run validation tests to GREEN**

Run: `node --test tests/site-social-validation.test.mjs`
Expected: PASS.

- [ ] **Step 5: Write failing guest-bootstrap tests with a stub Supabase client**

Assert `bootstrapGuest` refuses missing CAPTCHA, passes `captchaToken` to anonymous sign-in, persists no privileged key, and attempts only safe profile-field creation/update.

- [ ] **Step 6: Implement `assets/site-social-auth.mjs`**

Use Supabase anonymous auth; authorization never trusts `user_metadata`. Browser config contains only the project URL, publishable key, and Turnstile public site key.

- [ ] **Step 7: Run auth tests**

Run: `node --test tests/site-social-auth.test.mjs tests/site-social-validation.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add assets/site-social-auth.mjs assets/site-social-validation.mjs data/site-social-config.json tests/site-social-*.test.mjs
git commit -m "feat: add secure site guest bootstrap"
```

### Task 3: Controlled message-send Edge Function and realtime broadcast

**Files:**
- Create: `supabase/functions/send-site-message/index.ts`
- Modify: `supabase/config.toml`
- Modify: `supabase/migrations/<generated>-site_global_chat.sql`
- Create: `tests/send-site-message.test.mjs`

**Interfaces:**
- Consumes: authenticated user JWT, `site_profiles`, centralized rate constants, optional `reply_to`.
- Produces: `POST send-site-message` response `{ id, created_at }`; database trigger broadcasts insert/update/delete events to private topic `site:global`.

- [ ] **Step 1: Write failing function tests using dependency-injected/stubbed auth and data adapters**

Cover: unauthenticated request, body >300, blank/control-only body, banned user, muted user, second message inside 3 seconds, invalid `reply_to`, valid send, and direct forged author/display-name fields being ignored.

- [ ] **Step 2: Run RED**

Run: `node --test tests/send-site-message.test.mjs`
Expected: FAIL because function/core handler does not exist.

- [ ] **Step 3: Implement the Edge Function core and handler**

Leave JWT verification enabled for this user-authenticated function. Use the caller JWT to identify the user and a server-only Supabase secret client for the privileged insert after validation.

- [ ] **Step 4: Add the database broadcast trigger**

Use supported Realtime broadcast functions from the database without creating/modifying objects in the `realtime` schema. Broadcast only safe public fields needed by clients.

- [ ] **Step 5: Add private-channel authorization policies on `realtime.messages`**

Allow authenticated site users to receive `site:global` Broadcast/Presence. Do not add arbitrary new tables/functions inside the locked `realtime` schema.

- [ ] **Step 6: Run unit + local function/database tests**

Run: `node --test tests/send-site-message.test.mjs` plus local Supabase function/database verification. Expected: PASS for all rejection and valid-send cases.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/send-site-message supabase/config.toml supabase/migrations tests/send-site-message.test.mjs
git commit -m "feat: add controlled global chat send path"
```

### Task 4: Realtime chat client, history reconciliation, presence, replies/reactions/reports

**Files:**
- Create: `assets/site-global-chat.mjs`
- Create: `tests/site-global-chat.test.mjs`
- Modify: `supabase/migrations/<generated>-site_global_chat.sql`

**Interfaces:**
- Consumes: guest session from Task 2, `send-site-message` from Task 3, safe history/read endpoints/views.
- Produces: `createGlobalChatController({ supabase, userId })` with methods `loadHistory()`, `connect()`, `disconnect()`, `sendMessage()`, `react()`, `report()`, and observable state for connection/presence/unread counts.

- [ ] **Step 1: Write failing controller tests**

Cover initial history order, dedupe by message ID after reconnect, tombstone update, unread increment while hidden, reply linkage, allowlisted reaction, report creation, Presence connect/disconnect count, and cleanup/unsubscribe.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-global-chat.test.mjs`
Expected: FAIL because controller does not exist.

- [ ] **Step 3: Implement the controller**

History comes from persisted rows first; Broadcast merges live events by ID/version/timestamp. Presence stores only low-frequency fields `{ user_id, display_name, page, last_seen }`.

- [ ] **Step 4: Add any missing grants/RLS for reactions/reports/history reads**

Keep direct message-table INSERT blocked; client write permissions are only for the specifically approved reaction/report operations.

- [ ] **Step 5: Run tests**

Run: `node --test tests/site-global-chat.test.mjs tests/site-social-validation.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add assets/site-global-chat.mjs supabase/migrations tests/site-global-chat.test.mjs
git commit -m "feat: add realtime global chat client"
```

### Task 5: Site-wide panel shell and responsive UI

**Files:**
- Create: `assets/site-social.mjs`
- Create: `assets/site-social.css`
- Create: `tests/site-social-ui.test.mjs`
- Modify: root public HTML pages selected by the spec

**Interfaces:**
- Consumes: `site-social-auth.mjs`, `site-global-chat.mjs`; exposes a tab hook for the later Ask Hynoe plan.
- Produces: persistent launcher/panel with `GLOBAL CHAT` and placeholder-ready `ASK HYNOE` tab, remembered panel/tab state, unread badge, online indicator, mobile bottom sheet, keyboard/focus behavior.

- [ ] **Step 1: Write failing static/UI contract tests**

Assert every intended public page loads the same versioned `assets/site-social.css` + `assets/site-social.mjs`; `chat-admin.html` does not load visitor panel; markup created by the module contains text labels `GLOBAL CHAT` and `ASK HYNOE`; no user content path uses `innerHTML`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-social-ui.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement panel injection and responsive CSS**

Desktop fixed bottom-right panel; mobile safe-area-aware bottom sheet; composer remains visible above virtual keyboard; `prefers-reduced-motion` respected; icon-only primary navigation prohibited.

- [ ] **Step 4: Update CSP on public pages**

Allow only exact Supabase project/auth/realtime/function origins and Turnstile origins required by the implementation; do not add broad `*` sources.

- [ ] **Step 5: Run static tests and existing site regression tests**

Run: `node --test tests/site-social-ui.test.mjs tests/navigation.test.mjs tests/mobile-outpost.test.mjs tests/mini-player.test.mjs`
Expected: PASS with no existing navigation/player regression.

- [ ] **Step 6: Commit**

```bash
git add assets/site-social.mjs assets/site-social.css ./*.html tests/site-social-ui.test.mjs
git commit -m "feat: add site-wide social panel"
```

### Task 6: Moderation/admin surface and audit trail

**Files:**
- Create: `site-admin.html`
- Create: `assets/site-social-admin.mjs`
- Create: `assets/site-social-admin.css`
- Create: `supabase/functions/site-admin-action/index.ts`
- Modify: `supabase/config.toml`
- Modify: `supabase/migrations/<generated>-site_global_chat.sql`
- Create: `tests/site-admin.test.mjs`

**Interfaces:**
- Consumes: permanent Supabase admin/moderator account; server-controlled role data.
- Produces: authenticated moderation operations for tombstone/delete, mute, ban/unban, report resolve, announcement pin/unpin, pause/unpause posting, audit-log append.

- [ ] **Step 1: Write failing admin authorization tests**

Assert anonymous guest cannot perform any admin action; permanent non-admin cannot perform admin action; moderator/admin can perform only allowed actions; no role decision reads `user_metadata`; every successful action creates an audit record.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-admin.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement authenticated admin Edge Function**

Authorization is server-side and checks immutable role state. Do not store admin secrets in URL/query/localStorage.

- [ ] **Step 4: Implement `site-admin.html` and admin client**

Sections: chat status/pause, recent messages, reports, muted/banned users, pinned announcement editor, moderation audit. Keep Help Bot quality section as a placeholder hook for the second plan.

- [ ] **Step 5: Run tests + local authorization smoke tests**

Expected: guest escalation attempts fail; valid admin operations pass and broadcast resulting message/announcement updates.

- [ ] **Step 6: Commit**

```bash
git add site-admin.html assets/site-social-admin.* supabase/functions/site-admin-action supabase/config.toml supabase/migrations tests/site-admin.test.mjs
git commit -m "feat: add global chat moderation console"
```

### Task 7: Replace old relay UI, rules copy, and production verification

**Files:**
- Modify: `watch.html`
- Modify: `assets/watch.mjs`
- Modify: `community-rules.html`
- Modify/Delete after verification: `data/chat-config.json`, `relay/` visitor-relay references only
- Create: `tests/site-chat-rollout.test.mjs`

**Interfaces:**
- Consumes: all Global Chat tasks.
- Produces: live site experience where “chat” exclusively means site Global Chat and unrelated watch/game features continue working.

- [ ] **Step 1: Write failing rollout regression test**

Assert visitor-facing files contain no wording that website chat sends messages to Minecraft/Bloom, `watch.html` retains stream/game hooks, and Global Chat assets are present.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-chat-rollout.test.mjs`
Expected: FAIL while old relay copy/code remains.

- [ ] **Step 3: Replace old campfire/relay integration and update community rules**

Do not delete unrelated watch/game logic. Keep obsolete relay backend disabled until production smoke tests pass.

- [ ] **Step 4: Run the full repository test suite**

Run: `node --test tests/*.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Run production-like two-browser smoke tests**

Verify anonymous bootstrap, two-browser send/receive, presence change, reply/reaction/report, moderation propagation, reconnect/dedupe, mobile keyboard composer visibility, and no secret in page source/network responses.

- [ ] **Step 6: Verify Supabase security and health**

Run current Supabase Security/Performance/Health advisors and inspect Auth/Realtime/Edge Function errors. Expected: no unresolved critical issue introduced by launch.

- [ ] **Step 7: Remove obsolete relay assets/config only after smoke tests are green**

If repository search shows no remaining visitor dependency, remove the old visitor relay config/code; otherwise leave disabled and document the remaining non-visitor use.

- [ ] **Step 8: Commit**

```bash
git add watch.html assets/watch.mjs community-rules.html relay data/chat-config.json tests/site-chat-rollout.test.mjs
git commit -m "feat: launch site-native global chat"
```
