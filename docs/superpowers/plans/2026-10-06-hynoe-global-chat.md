# Hynoe Global Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dormant website-to-Minecraft relay with a site-native, guest-first, realtime Hynoe Global Chat that never contacts Bloom or Minecraft.

**Architecture:** Reuse the existing Cloudflare Worker + SQLite Durable Object foundation for origin checks, storage, transactions, rate limiting, admin controls, and expiry. Add opaque signed guest sessions and Durable Object WebSocket fan-out, with HTTP polling fallback in the browser. Keep the public site shell small and lazy-load chat after the Hynoe Community panel opens.

**Tech Stack:** Static HTML/CSS/ES modules on GitHub Pages, Cloudflare Worker + SQLite Durable Object, Turnstile, Node `node:test`, Playwright browser tests.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-global-chat-ask-hynoe-design.md`

## Global Constraints

- Global Chat is for `hynoesmp.com` and Hynoe Outpost only; no Bloom, Minecraft, Discord, or YouTube relay.
- Anyone may read; guest posting requires a pseudonymous guest session, no email/password/date of birth.
- Ordinary profanity is censored and posted; severe abuse, slurs, threats, sexual-minor content, doxxing, scams/phishing, malicious links, staff impersonation, control/command injection, repeated evasion, and high-rate spam are rejected before publication.
- Public message retention defaults to 24 hours and is count-capped; guest metadata must not become an indefinite profile.
- Raw IP addresses must not be persisted in application storage.
- Existing Outpost save/recovery, Hall of Legends opt-in publishing, on-site YouTube embed, Tap Mine, mini-player, and manual-only Help behavior must remain intact.
- All user content renders with DOM text nodes/`textContent`, never untrusted `innerHTML`.
- Shared browser-facing asset token for this release is `20261006e`.

## Review Focus

- Unicode/leet/punctuation profanity evasion must not bypass censor/block rules, while benign words must not be mangled.
- Expired/stolen/malformed guest tokens must fail closed without exposing whether an actor exists.
- Reconnect storms or WebSocket failure must degrade to bounded polling without duplicate messages or duplicate sends.
- A muted guest changing only their callsign must remain muted for the active guest/session identity.
- The closed community panel must never intercept Outpost taps, mobile scrolling, or mini-player interaction.

---

### Task 1: Convert the Worker from Minecraft relay to site-native chat core

**Files:**
- Modify: `relay/worker.mjs`
- Modify: `relay/wrangler.toml`
- Modify: `relay/README.md`
- Modify: `tests/relay.test.mjs`

**Interfaces:**
- Produces: `normalizeForModeration(text: string): string`
- Produces: `moderateMessage(text: string): {action:'allow'|'censor'|'block', text:string, reason?:string}`
- Produces: `validateMessage(body: unknown): {text:string}`
- Produces: site-only `/messages` GET and POST behavior with no external delivery call.

- [ ] **Step 1: Write failing relay tests for zero Minecraft dependency and moderation.** Assert `relay/worker.mjs` exports `normalizeForModeration` and `moderateMessage`; ordinary profanity returns `censor`; a representative severe/slur/evasion fixture returns `block`; commands/control characters/links remain rejected; accepted messages persist directly without any fetch to `mc.bloom.host`; source text/config contain no `BLOOM_API_KEY`, `BLOOM_SERVER_ID`, `tellraw`, or `mc.bloom.host`.
- [ ] **Step 2: Run `node --test tests/relay.test.mjs` and verify the new tests fail.**
- [ ] **Step 3: Implement the site-native moderation/storage path in `relay/worker.mjs`.** Remove `commandFor()` and all Bloom fetch/config requirements. Normalize Unicode with `NFKC`, moderation-only leet/punctuation evasion, keep display text separate, censor ordinary profanity, hard-block severe categories, then persist accepted records before broadcasting.
- [ ] **Step 4: Update `relay/wrangler.toml` and `relay/README.md`.** Remove Bloom variables/copy; add `SESSION_SECRET` as a required private secret; keep `TURNSTILE_SECRET`, `IP_SALT`, `ADMIN_TOKEN`, `CHAT_ENABLED`, `ALLOWED_ORIGINS`.
- [ ] **Step 5: Run `node --test tests/relay.test.mjs`; expected: all relay tests PASS and no test observes a Minecraft/Bloom request.**
- [ ] **Step 6: Commit with message `feat: convert relay to Hynoe Global Chat backend`.**

### Task 2: Add low-friction guest sessions and identity-safe moderation

**Files:**
- Modify: `relay/worker.mjs`
- Modify: `tests/relay.test.mjs`

**Interfaces:**
- Consumes: Task 1 moderation/storage core.
- Produces: `POST /session` with `{token, callsign, expiresAt}` after Turnstile verification.
- Produces: `POST /session/name` for callsign changes.
- Produces: authenticated guest requests using `Authorization: Guest <opaque-token>`.

- [ ] **Step 1: Add failing tests for session bootstrap, token expiration/tamper rejection, reserved names, rename persistence, and mute-by-actor rather than mute-by-name.** Include the review-focus cases for malformed tokens and a muted guest changing callsigns.
- [ ] **Step 2: Run `node --test tests/relay.test.mjs`; expected: FAIL on missing session endpoints/token validation.**
- [ ] **Step 3: Implement session tokens using HMAC-SHA-256 with `SESSION_SECRET`.** Token payload contains opaque actor id, issued/expiry times, and a nonce/version; no raw IP. Use Turnstile only for bootstrap/reverification, and continue salted ephemeral IP hashes for abuse limits.
- [ ] **Step 4: Implement callsign generation/rename.** Use a generated two-word/number guest callsign, validate 2–20 characters, reject staff/system-reserved names, and keep actor identity stable across rename.
- [ ] **Step 5: Convert send/report/mute logic to actor/session identity while preserving server-side cooldowns and report de-duplication.**
- [ ] **Step 6: Run `node --test tests/relay.test.mjs`; expected: all session, mute, moderation, origin, size-limit, retention, and admin-auth tests PASS.**
- [ ] **Step 7: Commit with message `feat: add guest sessions to Global Chat`.**

### Task 3: Add realtime fan-out with safe polling fallback

**Files:**
- Modify: `relay/worker.mjs`
- Modify: `tests/relay.test.mjs`
- Create: `tests/community-realtime.test.mjs`

**Interfaces:**
- Consumes: guest-authenticated message records from Tasks 1–2.
- Produces: `GET /socket` WebSocket upgrade for authenticated/read-only clients.
- Produces: public message event shape `{type:'message', message:{id,displayName,displayKind,text,createdAt}}` and moderation events `{type:'delete',id}` / `{type:'status',paused}`.

- [ ] **Step 1: Add failing unit tests for public event serialization, deletion/status broadcasts, and de-duplication keys.**
- [ ] **Step 2: Run `node --test tests/relay.test.mjs tests/community-realtime.test.mjs`; expected: FAIL before socket/event support exists.**
- [ ] **Step 3: Implement Durable Object WebSocket acceptance/broadcast and bounded connection cleanup.** Do not expose actor ids, IP hashes, report metadata, or moderation internals in public events.
- [ ] **Step 4: Keep `GET /messages` as the polling/reconnect source of truth with stable message ids and chronological order.**
- [ ] **Step 5: Run the two test files; expected: PASS, including reconnect/de-duplication behavior.**
- [ ] **Step 6: Commit with message `feat: add realtime Global Chat delivery`.**

### Task 4: Build the shared Hynoe Community shell and Global Chat client

**Files:**
- Create: `assets/community-shell.mjs`
- Create: `assets/community.css`
- Create: `assets/global-chat.mjs`
- Modify: `assets/common.js`
- Modify: `watch.html`
- Modify: all public HTML pages that load the shared shell/CSP as required
- Modify: `data/chat-config.json`
- Create: `tests/community-ui.test.mjs`
- Modify: `tests/browser-mobile.mjs`
- Modify: `tests/browser-first-load.mjs`

**Interfaces:**
- Consumes: `/session`, `/session/name`, `/messages`, `/report`, `/socket` from Tasks 2–3.
- Produces: one shared launcher with `Global Chat` and a placeholder `Ask Hynoe` tab hook for the second plan.
- Produces: local keys `hynoeCommunityGuestV1` and `hynoeCommunityBlocksV1`.

- [ ] **Step 1: Write failing static/browser tests.** Assert `Server Chat`/`SETUP PENDING` copy is gone; shared launcher exists; closed panel does not cover/intercept Outpost; mobile panel has no horizontal overflow; callsign persists across navigation; local block hides selected callsign only for that browser; unread count is bounded; `20261006e` is used consistently for new shared assets.
- [ ] **Step 2: Run `node --test tests/community-ui.test.mjs tests/mobile-outpost.test.mjs tests/mini-player.test.mjs`; expected: new tests FAIL, existing regressions stay green.**
- [ ] **Step 3: Implement `community-shell.mjs` with lazy loading.** Closed by default, desktop right drawer, mobile full-height sheet, Escape/focus restoration, safe-area padding, reduced-motion support, no pointer interception while closed.
- [ ] **Step 4: Implement `global-chat.mjs`.** Bootstrap/reuse guest session, render recent messages with DOM node creation, WebSocket first with bounded polling fallback, send/report/block/rename flows, visible reconnect/offline state, and no automatic retries of failed sends.
- [ ] **Step 5: Update shared copy and CSP/config.** Replace server-chat wording; point `connect-src` only at the configured community endpoint/Turnstile; keep blank/unconfigured config non-breaking.
- [ ] **Step 6: Run `node --test tests/community-ui.test.mjs tests/mobile-outpost.test.mjs tests/mini-player.test.mjs tests/navigation.test.mjs tests/security.test.mjs`; expected: PASS.**
- [ ] **Step 7: Run Playwright mobile/first-load coverage; expected: launcher opens/closes at all supported phone widths, no overflow, and Tap Mine remains tappable before/after panel use.**
- [ ] **Step 8: Commit with message `feat: add sitewide Hynoe Global Chat UI`.**

### Task 5: Upgrade the Hynoe Moderation Console

**Files:**
- Modify: `chat-admin.html`
- Modify: `assets/chat-admin.mjs`
- Modify: `assets/community.css`
- Modify: `relay/worker.mjs`
- Modify: `tests/relay.test.mjs`
- Create: `tests/chat-admin.test.mjs`

**Interfaces:**
- Consumes: admin bearer authorization and chat records from Tasks 1–3.
- Produces: `/admin`, `/admin/pause`, `/admin/delete`, `/admin/mute`, `/admin/unmute`, `/admin/announce`.

- [ ] **Step 1: Add failing tests for report detail visibility, delete, mute/unmute, pause/resume, system announcement, and no Minecraft-specific admin copy.**
- [ ] **Step 2: Run `node --test tests/relay.test.mjs tests/chat-admin.test.mjs`; expected: FAIL on the new moderation controls.**
- [ ] **Step 3: Implement admin endpoints and console UI.** Keep admin token in page memory only; public responses never expose actor/ip hashes; system announcements get `displayKind:'system'` and cannot be guest-spoofed.
- [ ] **Step 4: Run the two tests; expected: PASS.**
- [ ] **Step 5: Commit with message `feat: expand Hynoe chat moderation console`.**

### Task 6: Full regression and production-readiness gate

**Files:**
- Modify: `.github/workflows/browser-mobile-verify.yml`
- Modify: release notes under `docs/releases/` if the project pattern requires it

**Interfaces:**
- Consumes: completed Global Chat backend/UI/admin features.
- Produces: CI coverage that blocks regressions before deployment.

- [ ] **Step 1: Extend CI triggers/commands for `relay/**`, community assets, community tests, admin files, and `data/chat-config.json`.**
- [ ] **Step 2: Run `node --test tests/*.test.mjs`; expected: all tests PASS.**
- [ ] **Step 3: Run existing Playwright suites: `tests/browser-mobile.mjs`, `tests/browser-first-load.mjs`, and `RESTORED_RUN_ENGINE=chromium node tests/browser-restored-run.mjs`; expected: PASS.**
- [ ] **Step 4: Add/execute a two-context browser test using a local/mock community backend to prove realtime chat, profanity censor display, report/block, reconnect fallback, and no duplicate messages.**
- [ ] **Step 5: Verify source/network assertions contain no Bloom/Minecraft chat endpoint or `tellraw` path.**
- [ ] **Step 6: Verify all 15 public pages still render and the Watch page keeps privacy-enhanced on-site YouTube behavior, Hall of Legends opt-in publishing, and saved-state Tap Mine behavior.**
- [ ] **Step 7: Commit with message `test: gate Hynoe Global Chat release`.**
