# Hynoe Global Chat + Ask Hynoe Design

Date: 2026-10-06
Status: Approved product direction; implementation pending plan review
Repository: `HynoeGeshi/hynoesmp`

## 1. Goal

Replace the old website-to-Minecraft "Server Chat" concept with a site-native community system for `hynoesmp.com` and Hynoe Outpost only, and add a separate page-aware help assistant named **Ask Hynoe**.

The result must:

- never relay public chat to Bloom or Minecraft;
- provide one site-wide Global Chat visible from all main Hynoe pages and from Hynoe Outpost;
- allow anonymous guest participation without an email or account;
- preserve a clear upgrade path to verified Hynoe accounts later;
- moderate user-generated content before publication;
- make ordinary profanity readable through censoring while hard-blocking severe abuse and unsafe content;
- provide a private Ask Hynoe assistant that prefers official Hynoe content and only falls back to external Minecraft/mod information when Hynoe does not answer the question;
- remain mobile-first, low-friction, inexpensive to operate, and isolated from Outpost save/progression logic;
- preserve existing Hall of Legends opt-in publishing, on-site video behavior, save recovery, Tap Mine behavior, and manual-only Help.

## 2. Product surface

### 2.1 Shared Hynoe Community launcher

Every main site page gets one lightweight shared launcher labeled for the Hynoe Community. The existing "Watch, Play & Chat" navigation language should be updated so it no longer implies Minecraft/server chat.

Opening the launcher reveals a two-tab panel:

1. **Global Chat** — public site community chat.
2. **Ask Hynoe** — private help assistant.

Desktop uses a right-side drawer that does not cover core navigation. Mobile uses a full-height sheet with safe-area padding and a clearly visible close control. Neither surface auto-opens on page load.

The launcher shell loads with the common site script, while chat/help client code lazy-loads only after first open.

### 2.2 Global Chat

Global Chat is website/Outpost-only. Minecraft and Bloom are out of scope and must not appear in the runtime code path.

Behavior:

- anyone may read recent chat;
- first-time posters create a low-data guest session;
- each guest receives a generated callsign, stored locally, and may rename it subject to validation;
- staff-like/reserved names are rejected;
- no email, password, date of birth, or account is required for guest chat;
- first post requires accepting the public-chat rules/age acknowledgement presented in neutral language;
- recent messages persist for a bounded retention window rather than indefinitely;
- users can report messages;
- users can locally block callsigns without affecting server state;
- moderators can delete messages, mute guest identities, pause chat, review reports, and issue system messages;
- moderator/system messages are visually distinct and cannot be spoofed by guests;
- verified account identity can later replace the guest actor without changing the message model.

### 2.3 Ask Hynoe

Ask Hynoe is not a public-chat participant. Each visitor receives a private assistant experience.

The assistant is page-aware and uses the current page, active Outpost section when available, and official Hynoe knowledge as first-party context.

Source priority:

1. current page/section;
2. Hynoe site knowledge index;
3. Hynoe Outpost/game help content;
4. Hynoe rules, commands, progression, economy, join/install, updates, and handbook-style content;
5. approved external Minecraft/mod sources only when Hynoe lacks the answer.

Answers based on Hynoe content should offer a direct deep link to the relevant page/section when possible. Answers that require external sources must be visibly labeled as general Minecraft/mod information rather than Hynoe-specific rules.

If no trustworthy answer is available, the bot must say it cannot verify the answer rather than inventing one.

## 3. Architecture

### 3.1 Reuse the existing Cloudflare Worker/Durable Object foundation

The existing `relay/worker.mjs` already provides useful primitives:

- allowed-origin checks;
- request body size limits;
- Turnstile verification;
- Durable Object state;
- transactions;
- per-visitor rate limits;
- global anti-spam spacing;
- report storage;
- mute storage;
- admin bearer-token authorization;
- pause state;
- expiry alarms.

Implementation should keep those general protections while removing every Bloom/Minecraft delivery dependency.

The Worker becomes a Hynoe community backend, not a relay.

### 3.2 No Bloom/Minecraft runtime dependency

Remove or retire:

- `BLOOM_API_KEY` requirement;
- `BLOOM_SERVER_ID` requirement;
- `commandFor()`/`tellraw` generation;
- `mc.bloom.host` requests;
- response text describing console acceptance or uncertain Minecraft delivery;
- admin copy warning that Minecraft messages cannot be recalled.

A regression test must assert that the community backend contains no Bloom API destination and never performs a Minecraft command request.

### 3.3 Guest session model

The current relay re-runs Turnstile verification per send/report. Replace that interaction model with a session bootstrap:

- client requests/creates a guest session after one successful Turnstile verification;
- backend returns a short-lived or rolling opaque guest session token signed/validated server-side;
- the token identifies a pseudonymous guest actor, not a real-world identity;
- client stores the token and callsign locally;
- subsequent chat posts/reports use the session token;
- suspicious behavior, expiration, or session recreation can require Turnstile again;
- raw IPs are not stored in application state;
- rate-limiting may continue to use a salted ephemeral hash generated from Cloudflare connection metadata.

The guest actor record should support a future `verified_user_id` field or equivalent mapping without breaking existing message records.

### 3.4 Realtime delivery

Use the existing Cloudflare/Durable Object stack for message persistence and realtime fan-out.

Preferred transport:

- WebSocket from the Durable Object for active chat clients;
- HTTP GET fallback/polling if WebSocket setup fails;
- HTTP POST for messages, reports, and moderation actions.

The UI must visibly degrade to reconnecting/offline rather than silently losing messages.

### 3.5 Data model

Message record:

- `id`
- `actorId`
- `displayName`
- `displayKind` (`guest`, future `verified`, `moderator`, `system`)
- `text`
- `createdAt`
- moderation metadata needed server-side, not exposed publicly

Guest/session record:

- opaque actor/session id
- current callsign
- created/last-seen timestamps
- mute status/expiry where applicable
- abuse/rate-limit metadata

Report record:

- message id
- reporting actor/session hash/id
- timestamp
- optional normalized reason enum

Retention:

- default public message retention: 24 hours, capped by count;
- reports retained only as long as operationally needed for the moderation window;
- anti-spam/session metadata expires automatically;
- do not create indefinite guest profiles.

## 4. Moderation

### 4.1 Moderation pipeline

Every message is processed server-side before publication:

`normalize -> validate -> rate limit -> language moderation -> severe-safety moderation -> persist -> broadcast`

No client-only moderation rule is authoritative.

### 4.2 Normalization

Before matching/filtering:

- Unicode normalize;
- collapse repeated whitespace;
- remove disallowed control/bidi/zero-width formatting characters;
- normalize obvious punctuation-separated word evasion;
- normalize common leetspeak substitutions only for moderation matching, while preserving display text where safe;
- enforce one-line input and length limits.

### 4.3 Ordinary profanity

Ordinary profanity should be censored and still published when no severe rule is triggered.

Example behavior:

- input: `this is fucking wild`
- published form: `this is f****** wild`

The exact censor function should preserve enough context for normal conversation while not reproducing the full term.

### 4.4 Hard-block categories

Reject the message entirely for:

- slurs/hateful abuse;
- credible threats or instructions targeting a person;
- sexual content involving minors;
- doxxing or obvious attempts to publish private contact/location/account information;
- phishing/scam attempts;
- malicious or unapproved links;
- staff/system impersonation;
- repeated filter-evasion after warnings;
- commands/control-code injection;
- severe harassment patterns;
- high-rate/repeated spam.

The sender receives a short reason category, not the internal detection rule or full moderation dictionary.

### 4.5 Admin controls

Evolve `chat-admin.html` and `assets/chat-admin.mjs` into a Hynoe Moderation Console with:

- chat pause/resume;
- message delete;
- guest mute/unmute;
- report counts and report detail;
- moderation reason visibility;
- system announcement posting;
- refresh/live status;
- clear separation between public messages and moderation-only metadata.

Admin authorization remains server-side through a secret bearer token stored only in page memory for the session. No admin secret may appear in Git or static config.

## 5. Ask Hynoe knowledge system

### 5.1 Official knowledge index

Create a generated static knowledge index from the repository's own public content rather than hand-maintaining duplicate answers.

Initial indexed sources include:

- `index.html`
- `start.html`
- `mca.html`
- `progression.html`
- `economy.html`
- `bosses.html`
- `join.html`
- `modpack.html`
- `updates.html`
- `modded-minecraft-server.html`
- `community-rules.html`
- Outpost help/explanatory strings that are stable enough to index
- selected structured data files where they contain player-facing truth

The build script should extract section ids, headings, concise visible text, source path, and source title into a compact JSON index.

The index must exclude private/admin content, secrets, hidden implementation notes, and user chat data.

### 5.2 Retrieval behavior

For each Ask Hynoe question:

- capture current page and relevant section id when available;
- run deterministic local retrieval against the official index first;
- rank current-page/current-section material above general matches;
- if retrieval confidence is sufficient, answer from Hynoe content and include source links;
- if insufficient, optionally call an external answer/search provider from the server side;
- never expose provider secrets to the browser;
- clearly mark external fallback answers.

The first release may use a deterministic retrieval/FAQ answerer for official Hynoe content and reserve generative external fallback for configured deployments. The UI must remain useful when no external provider is configured.

### 5.3 Outpost context

The Outpost page should provide non-sensitive UI context to Ask Hynoe, such as:

- current room/tab;
- chapter/section name;
- visible help topic;

Do not send the full local game save by default. The bot should not mutate game state.

## 6. Frontend implementation

Add focused modules instead of expanding `assets/common.js` or `assets/watch.mjs` further:

- `assets/community-shell.mjs` — launcher, tab switching, lazy module loading, shared panel state;
- `assets/community.css` — desktop/mobile shell styling;
- `assets/global-chat.mjs` — guest identity, connection, message list, send/report/block UI;
- `assets/ask-hynoe.mjs` — private assistant UI and official knowledge retrieval client;
- `data/hynoe-knowledge.json` — generated official knowledge index;
- `scripts/build_hynoe_knowledge.mjs` — deterministic index generator.

Use DOM `textContent`/node creation for user content. Never insert untrusted chat text with `innerHTML`.

The shared shell should integrate through the common page script or explicit common include pattern already used by the site, and `watch.html` should use the same shell rather than a separate Outpost chat implementation.

## 7. Performance and UX

Requirements:

- no community drawer auto-open;
- no blocking network call during initial page render;
- lazy-load chat/help code on first open;
- message list virtualizes or caps rendered history if needed;
- mobile panel respects safe-area insets;
- mobile input remains visible above the software keyboard;
- panel must not create horizontal overflow;
- panel must not cover or intercept Outpost controls while closed;
- reconnect state is visible;
- unread badge is bounded and non-intrusive;
- reduced-motion preferences are respected;
- keyboard focus is trapped only while the panel is open and restored on close;
- Escape closes the desktop drawer;
- screen-reader labels and live regions are deliberate rather than noisy.

## 8. Security/privacy

- allowed origins remain explicit;
- backend rejects oversized/invalid JSON;
- secrets remain server-side only;
- CSP `connect-src` updated only for the deployed community endpoint(s);
- all user text is treated as untrusted;
- no arbitrary command execution path;
- no Bloom credentials or Minecraft command endpoint;
- raw email is not collected for guest chat;
- raw IP is not persisted in application storage;
- guest data retention is bounded;
- bot conversation history stays local by default unless a future account-backed feature explicitly changes that policy;
- external bot/search provider configuration is optional and server-side;
- official Hynoe answers must never be silently overwritten by uncertain external information.

## 9. Configuration

Replace/extend `data/chat-config.json` with public configuration appropriate for the site-native service, for example:

- community endpoint URL;
- public Turnstile site key;
- public feature flags for Global Chat and Ask Hynoe.

Private secrets remain Worker environment secrets.

A completely unconfigured backend must leave the site functional: the launcher can show chat/help as unavailable while Outpost and the rest of the site continue to work.

## 10. Testing and release gates

### 10.1 Unit/backend tests

Add/expand tests for:

- message validation;
- profanity censoring;
- severe-category blocking;
- filter-evasion normalization;
- reserved-name enforcement;
- staff/system spoof prevention;
- rate limits;
- global flood protection;
- guest-session creation/expiration;
- reports;
- local/public data separation;
- mutes;
- deletion;
- pause/resume;
- admin authorization;
- CORS/origin rejection;
- request-size limits;
- retention cleanup;
- zero Bloom/Minecraft network requests.

### 10.2 Knowledge/help tests

Verify:

- index generator is deterministic;
- expected Hynoe pages/sections are indexed;
- private/admin content is excluded;
- current-page answers outrank unrelated pages;
- official Hynoe answers link to the exact page/section;
- external fallback is visibly labeled;
- unverified questions produce an explicit uncertainty response instead of fabrication.

### 10.3 Browser tests

Run Chromium and WebKit/mobile coverage for:

- community launcher across public pages;
- drawer/sheet open/close;
- focus restoration;
- mobile keyboard/input layout where automation permits;
- two-client realtime chat;
- reconnect/fallback behavior;
- callsign persistence across navigation;
- report/block flows;
- Ask Hynoe page awareness;
- no horizontal overflow;
- no closed-panel pointer interception.

### 10.4 Regression suite

The existing Hynoe site tests remain required, including:

- all Node tests;
- browser mobile verification;
- first-load mobile test;
- restored-save Outpost test;
- Tap Mine saved-state rendering;
- mini-player behavior;
- sitewide mobile refresh/navigation;
- leaderboard behavior and opt-in publishing;
- on-site YouTube privacy-enhanced embed behavior.

Browser-facing cache tokens must be bumped consistently when shared assets change.

### 10.5 Production verification

Before calling the feature complete:

- deploy the site and Worker configuration;
- verify the live community endpoint from `hynoesmp.com`;
- send/read messages in two independent clients;
- verify a profanity-censored message;
- verify a severe test phrase is rejected without publication;
- verify report/delete/mute/pause in the live admin console;
- verify Ask Hynoe returns at least one exact Hynoe deep link;
- verify the live network log contains no Bloom/Minecraft requests;
- verify iPhone/WebKit layout and Outpost interactions on the deployed site.

## 11. Compatibility and migration

- Existing Hynoe Outpost local save keys and recovery logic are untouched.
- Existing `Server Chat`/`SETUP PENDING` copy is replaced with Hynoe Global Chat language.
- Existing relay code is migrated in place where practical so rate-limit/admin tests can evolve rather than being discarded.
- Existing `chat-admin.html` is upgraded rather than creating a second admin surface.
- Future verified accounts map onto the same actor/message model; guest-first launch does not block later Supabase/Auth integration.

## 12. Non-goals for this release

- no Minecraft/Bloom chat bridge;
- no Discord chat bridge;
- no YouTube chat synchronization;
- no email/password account system;
- no cloud game saves;
- no under-18 account system;
- no bot ability to modify Outpost state;
- no permanent public user profiles;
- no indefinite chat-history retention;
- no monetization tied to chat or the help bot.

## 13. Success criteria

The release is successful when a visitor can browse any Hynoe page, open one consistent Hynoe Community panel, participate in a moderated guest Global Chat without Minecraft/Bloom involvement, privately ask Ask Hynoe for site/game help, receive official Hynoe-first answers with useful deep links, and continue using Hynoe Outpost normally on desktop and mobile without regressions.
