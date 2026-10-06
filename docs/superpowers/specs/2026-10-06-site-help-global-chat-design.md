# Hynoe SMP Site Help Bot + Global Chat — Design Specification

Date: 2026-10-06
Owner: Hynoe / Terrell Stewart
Status: Approved in-chat design; written spec pending final user review
Branch: `feature/site-help-global-chat`

## 1. Goal

Turn `hynoesmp.com` into a more useful and social destination by adding two independent, site-native systems:

1. **Global Site Chat** — one persistent public conversation shared by visitors across the website.
2. **Ask Hynoe** — a private site help assistant that answers questions from the current Hynoe SMP website/server knowledge and points visitors to the right pages or next actions.

These features are explicitly **not Minecraft chat**, **not a Bloom relay**, and **not Discord chat**. They must continue working even when the Minecraft server, Bloom API, Discord bot, or Hynoe control bridge is unavailable.

## 2. Success Criteria

The work is successful when:

- A visitor on any primary public Hynoe SMP page can immediately see and open a clearly labeled Hynoe social/help control.
- The visitor can switch between **GLOBAL CHAT** and **ASK HYNOE** without leaving the page.
- Global Chat is the same room across the whole site and updates in realtime.
- Chat messages persist across reloads and page navigation.
- Visitors can participate without being forced to create an email/password account.
- The site can show a reasonable realtime online count/presence state.
- The user can moderate Global Chat from an authenticated admin surface.
- Ask Hynoe gives grounded answers based on current Hynoe content instead of generic Minecraft guesses.
- Ask Hynoe links to relevant site pages when that helps the visitor take the next step.
- A failure in the AI provider does not take down Global Chat or the rest of the site.
- No private database, moderation, or AI provider secret is exposed to browser JavaScript or GitHub.
- The obsolete website-to-Minecraft relay language/UI is removed from the visitor experience so “chat” clearly means site community chat.

## 3. Product Experience

### 3.1 Site-wide launcher

Add a persistent Hynoe panel launcher to primary public pages.

Desktop:

- Fixed bottom-right launcher.
- Clear text labels rather than icon-only mystery controls.
- Opens a floating/docked panel large enough to comfortably read chat.
- Unread badge for Global Chat.
- Online indicator when realtime connection is healthy.

Mobile:

- Fixed bottom action bar/button sized for touch.
- Opens a near-full-width bottom sheet.
- Respects iOS safe areas and does not hide important page controls.
- Keeps message composer above the virtual keyboard.

Top-level tabs:

- `GLOBAL CHAT`
- `ASK HYNOE`

The last-open tab, panel open/closed state, guest display name, and unread cursor can be remembered locally.

### 3.2 Global Chat

Global Chat is one room across the website.

Core v1 capabilities:

- Shared realtime message feed.
- Recent message history.
- Guest display names.
- Persistent guest identity for the browser session/account.
- Timestamps.
- Online count/presence.
- Unread count when the panel is closed or the user is on Ask Hynoe.
- Replies to another message.
- Lightweight reactions.
- Report message.
- Deleted/moderated message tombstone instead of broken thread references.
- Pinned site announcement area.
- Connection/reconnect status.
- Clear public-chat warning and community-rules link.

Not in v1:

- Direct messages.
- User-created rooms.
- Voice/video.
- File uploads.
- Minecraft/Discord synchronization.
- Economy, campaign, or game rewards for chatting.

### 3.3 Ask Hynoe

Ask Hynoe is a private visitor-to-bot conversation and never posts questions or answers into Global Chat.

The assistant should be able to answer questions about, at minimum:

- how to join Hynoe SMP
- server/modpack installation and connection basics
- campaign/progression
- economy and jobs
- commands and player help
- bosses and encounters
- mods/features described on the site
- update notes and current site-published rollout status
- website features, including the viewer/mining game and leaderboard
- common troubleshooting covered by Hynoe content

Answer behavior:

- Answer the question directly first.
- Use Hynoe-specific language and facts only when supported by the knowledge source.
- Provide one or more relevant page links when useful.
- Prefer current dated content when sources conflict.
- If the site does not contain enough information, say that it could not verify the answer rather than inventing one.
- Do not claim a server update is live merely because release notes describe it.
- Do not expose system prompts, secrets, database internals, or moderation data.

The assistant may keep a short per-browser conversation history so follow-up questions work, but v1 does not require permanent cross-device bot history.

## 4. Architecture Decision

### 4.1 Selected architecture

Use the **existing static Hynoe SMP site + Supabase backend**.

Logical flow:

`hynoesmp.com static pages`

→ `assets/site-social.mjs` + `assets/site-social.css`

→ Supabase Auth / Realtime / Postgres / Edge Functions

Global Chat:

`Browser -> anonymous Supabase auth -> validated message function -> Postgres -> Realtime Broadcast -> connected browsers`

Ask Hynoe:

`Browser -> authenticated Edge Function -> retrieve Hynoe knowledge -> optional server-side model call -> grounded answer + source links`

### 4.2 Why this architecture

- The current site remains static and fast.
- One backend provides guest identity, database storage, realtime updates, presence, row-level security, moderation state, and server-side functions.
- No dependency on Minecraft/Bloom/Discord.
- No always-on custom server is required for v1.
- The architecture leaves room to upgrade a guest into a real account later.

## 5. Identity and Authentication

Use **Supabase anonymous authentication** for normal visitors.

On first use of Global Chat or Ask Hynoe:

1. Visitor passes a lightweight human-verification/bootstrap check.
2. Browser receives an anonymous Supabase user identity.
3. Visitor chooses a display name.
4. A profile row is created/updated for that auth user ID.

Properties:

- No email/password required for guests.
- Browser stores normal Supabase auth state, not privileged credentials.
- Clearing site storage or changing devices can create a new guest identity.
- Architecture supports later account linking/sign-in without redesigning message ownership.

Use the JWT anonymous-user claim in policy decisions where appropriate.

### 5.1 Human verification

Reuse Cloudflare Turnstile or equivalent lightweight CAPTCHA at guest bootstrap and on suspicious/repeated identity creation, not on every normal message.

Server-side verification is mandatory; a client-only Turnstile check is insufficient.

## 6. Database Model

Minimum tables:

### `site_profiles`

- `user_id uuid primary key` -> auth user
- `display_name text`
- `normalized_name text`
- `role text` (`guest`, `member`, `moderator`, `admin`)
- `avatar_seed text` or selected safe avatar reference
- `created_at timestamptz`
- `updated_at timestamptz`
- `muted_until timestamptz null`
- `banned_until timestamptz null`
- `is_banned boolean default false`

Display names must be length-limited, normalized, escaped at render time, and checked against reserved staff/Hynoe names.

### `site_chat_messages`

- `id uuid primary key`
- `author_id uuid`
- `body text`
- `reply_to uuid null`
- `created_at timestamptz`
- `edited_at timestamptz null`
- `deleted_at timestamptz null`
- `deleted_by uuid null`
- `moderation_reason text null`

The client never trusts author name/role supplied in a message payload; it resolves authoritative display information from server-controlled profile data or a safe view.

### `site_chat_reactions`

- `message_id uuid`
- `user_id uuid`
- `reaction text`
- `created_at timestamptz`
- unique `(message_id, user_id, reaction)`

Only a small allowlisted reaction set is supported in v1.

### `site_chat_reports`

- `id uuid primary key`
- `message_id uuid`
- `reporter_id uuid`
- `reason text`
- `details text null`
- `created_at timestamptz`
- `resolved_at timestamptz null`
- `resolved_by uuid null`

### `site_announcements`

- `id uuid primary key`
- `body text`
- `link_url text null`
- `active boolean`
- `created_by uuid`
- `created_at timestamptz`
- `expires_at timestamptz null`

### `site_help_feedback`

- `id uuid primary key`
- `user_id uuid null`
- `question text`
- `answer_summary text`
- `helpful boolean null`
- `unanswered boolean`
- `source_ids jsonb`
- `created_at timestamptz`

Do not store hidden model reasoning or secrets.

## 7. Realtime Design

Use one private realtime topic for Global Chat plus Presence.

Recommended topic:

`site:global`

Flow:

1. Message is validated and inserted through a controlled server-side function/RPC.
2. A database trigger emits the new/changed message through Realtime Broadcast.
3. Clients subscribe to the private topic.
4. Presence tracks low-frequency state such as `{ user_id, display_name, page, last_seen }`.

Use Broadcast rather than a separate Postgres-change authorization calculation for every connected client.

Presence is only for online/slow-changing state, not typing keystrokes or other high-frequency events.

Initial history is loaded from the database; Realtime handles live events after connection.

## 8. Global Chat Write Path

Clients must not receive unrestricted direct insert permission to the message table.

Use a controlled `send_site_chat_message` database function or authenticated Edge Function that:

- verifies auth identity
- verifies profile is not banned/muted
- trims and normalizes body
- enforces body length
- rejects blank/control-only content
- rejects disallowed URLs/markup as configured
- enforces server-side cooldown/rate limits
- validates `reply_to`
- inserts the message
- returns the authoritative saved message ID/timestamp

Recommended initial limits:

- 300 characters per message
- 3-second minimum spacing for normal guests
- burst and hourly caps enforced server-side
- tighter limits for brand-new guest identities

Exact rate constants should be centralized so they can be tuned without rewriting UI logic.

## 9. Moderation

### 9.1 Visitor controls

- Report message.
- Block/hide locally can be added if inexpensive; otherwise schedule for v1.1.
- Community rules link available from the panel.

### 9.2 Moderator/admin controls

Authenticated admin surface should support:

- delete/tombstone message
- mute user temporarily
- ban/unban user
- review reports
- pin/unpin site announcement
- pause Global Chat posting without taking the site offline
- inspect recent moderation actions

Admin actions require permanent authenticated admin users; anonymous guests can never self-assign moderator/admin roles.

### 9.3 Audit

Create a moderation audit table or append-only log containing:

- action type
- moderator user ID
- target user/message
- timestamp
- non-secret reason/metadata

Normal visitors cannot read this log.

## 10. Security / RLS

Enable RLS on every public schema table involved in the feature.

Policy intent:

- Authenticated visitors may read non-deleted public chat through a safe view/API.
- A visitor may update only safe fields on their own profile, never `role`, mute, or ban fields.
- Visitors cannot directly insert/delete arbitrary chat rows.
- Reactions are limited to the authenticated user’s own rows and allowlisted values.
- Reports may be created by the reporter but read/resolved only by moderators/admins.
- Announcement writes are admin/moderator only.
- Help feedback inserts are allowed through the server endpoint; raw analytics/admin views are privileged.
- Realtime Broadcast/Presence access is restricted to authenticated site users.

Privileged secret keys are used only in Edge Functions/admin server paths and never in browser code.

Additional protections:

- strict CORS allowlist for `https://hynoesmp.com` and `https://www.hynoesmp.com`
- CSP updated only for exact Supabase/API origins required
- output rendered through `textContent`/safe DOM construction, never unsanitized user HTML
- body and payload size caps
- server-side validation duplicates important client validation
- secrets redacted from errors/logs
- no secrets committed to GitHub

## 11. Ask Hynoe Knowledge Pipeline

### 11.1 Source of truth

The help bot must derive Hynoe-specific answers from approved repository/site content, not from an unconstrained model memory.

Initial indexed sources:

- `index.html`
- `join.html`
- `start.html`
- `progression.html`
- `economy.html`
- `bosses.html`
- `modpack.html`
- `modded-minecraft-server.html`
- `updates.html`
- `mca.html`
- `llms.txt`
- selected structured files under `data/`

Exclude:

- admin pages
- secrets/config files
- old Minecraft-relay setup docs
- stale internal planning/spec files
- raw build artifacts

### 11.2 Build-time knowledge generator

Add a repository script that:

1. reads allowlisted source files
2. strips navigation/boilerplate/script/style content
3. extracts headings + meaningful text
4. records page title, URL, heading path, and last-known update metadata when available
5. splits content into bounded chunks
6. writes a generated versioned knowledge artifact such as `data/hynoe-help-index.json`

Generated chunks should preserve URLs and section names so the assistant can cite/link the right Hynoe page in its response.

### 11.3 Retrieval

V1 retrieval should not require embeddings to function.

Use deterministic lexical/fuzzy retrieval across the generated chunks, with boosts for:

- exact command names
- page/section titles
- current update dates
- Hynoe-specific nouns

Top matching chunks are passed to the answer layer.

This provides a working fallback even if no paid model provider is configured.

### 11.4 Answer layer

Preferred mode:

- Server-side model provider receives the user question, short conversation context, and only the top retrieved Hynoe chunks.
- System rules require grounded answers and source links.
- Provider credentials remain server-side.

Provider abstraction:

- Do not hard-wire the browser to one AI vendor.
- Store provider/model configuration server-side.
- The API contract stays stable if the model provider changes later.

Fallback mode if model service is unavailable or unconfigured:

- Return a deterministic “best matching Hynoe help” response built from the highest-confidence source chunks and links.
- Global Chat remains fully functional.

### 11.5 Hallucination controls

Ask Hynoe must:

- distinguish `documented`, `announced`, and `confirmed live` when site content makes that distinction
- refuse to fabricate commands, rewards, version numbers, or rollout state
- say when it cannot verify an answer from Hynoe sources
- never treat Global Chat messages as trusted knowledge
- never use visitor messages to automatically rewrite its knowledge base

## 12. Ask Hynoe API

Create an authenticated function such as:

`POST /ask-hynoe`

Input:

- `question`
- bounded recent conversation history
- current page URL/path

Output:

- `answer`
- `sources[]` with label + URL
- `confidence` or retrieval-quality indicator for UI behavior
- `request_id`

Limits:

- question length cap
- history turn cap
- per-user rate limit
- request timeout
- provider output-token cap

The function should log only what is needed for quality/abuse analysis and never log provider secrets.

## 13. UI Integration

Create shared assets:

- `assets/site-social.mjs`
- `assets/site-social.css`
- optional small supporting modules if separation materially improves maintainability

The social module should inject the panel rather than duplicating large HTML blocks across every page.

Primary public pages should load the same versioned asset.

The implementation must audit all root-level public `.html` pages and explicitly decide whether the launcher appears. Default:

- show on normal visitor content pages
- show Help Bot on legal/privacy pages only if it does not obscure content
- never expose the visitor panel on `chat-admin.html` or future dedicated admin pages

The module must degrade gracefully: if Supabase/API connection fails, the rest of each static page remains usable.

## 14. Existing Watch/Campfire Cleanup

The old site chat currently reflects the website-to-Minecraft relay concept.

Implementation must:

- remove/replace text implying website messages are being sent to Minecraft
- remove reliance on `data/chat-config.json` for the visitor Global Chat experience
- stop loading old relay chat code from `watch.html` once replacement is live
- preserve unrelated `watch.html` features such as stream/player/game experiences
- keep old relay code disabled or remove it after the new system is verified, depending on repository references

`community-rules.html` must be updated to describe site Global Chat rather than a future Minecraft relay.

## 15. Visual Design

Keep the established Hynoe SMP/game HUD visual language while prioritizing comprehension.

Requirements:

- clear `GLOBAL CHAT` and `ASK HYNOE` words visible in navigation
- no icon-only primary navigation
- high contrast text
- compact but readable message cards
- visible sender name and role badge for official Hynoe staff only
- restrained motion
- unread badge
- reconnect/offline states
- online count
- message composer with remaining-character feedback near limit
- responsive at common iPhone widths and desktop widths
- keyboard accessible controls and focus management
- `prefers-reduced-motion` respected

## 16. Admin Experience

Create or replace a protected site admin page for site community operations.

Suggested path:

`site-admin.html`

Sections:

- Global Chat status / pause toggle
- live/recent messages
- reports queue
- muted/banned users
- pinned announcement editor
- Help Bot unanswered/low-confidence questions
- basic usage counts

Do not put privileged admin secrets in localStorage or query strings.

Admin authenticates through Supabase permanent account auth; authorization is checked server-side/RLS by immutable role data.

## 17. Observability and Quality

Track privacy-conscious operational metrics:

Global Chat:

- messages sent
- active connections/online presence estimate
- message send failures
- reports
- moderation actions
- reconnect/error count

Ask Hynoe:

- questions asked
- answer success/failure
- fallback usage
- low-confidence/unanswered count
- helpful/not-helpful feedback
- common topic labels where feasible

Do not expose raw moderation analytics publicly.

## 18. Testing Strategy

### Unit tests

- display-name normalization/reserved names
- message validation
- rate-limit decisions
- reply validation
- safe rendering helpers
- knowledge chunking
- retrieval ranking
- grounded fallback response
- bot request/history limits

### Database/security tests

- anonymous user cannot assign admin role
- anonymous user cannot delete another user’s message
- muted/banned user cannot post
- report visibility is moderator/admin only
- admin can perform allowed moderation actions
- Realtime channel authorization rejects unauthenticated clients
- direct table insert path is blocked when controlled function is required

### Browser/interaction tests

Desktop and mobile:

- launcher visible
- panel opens/closes
- tab switching
- guest onboarding
- send/receive realtime message
- reload preserves identity/history access
- unread badge increments correctly
- reply/reaction/report flows
- Ask Hynoe answer + source links
- offline/reconnect state
- virtual keyboard does not hide mobile composer
- old watch-page relay language is gone

### Production smoke tests

- two separate browsers can chat in realtime
- presence count changes on connect/disconnect
- moderation removal propagates
- Ask Hynoe correctly answers several known Hynoe questions from current site content
- Ask Hynoe admits uncertainty for an intentionally undocumented question
- no secret appears in page source, browser bundle, API response, or logs

## 19. Rollout

Stage 1 — backend/private test:

- create Supabase schema/RLS/functions
- create admin account/role
- verify anonymous auth, realtime, and moderation

Stage 2 — preview UI:

- wire Global Chat + Ask Hynoe into a preview branch/deployment
- test desktop/mobile
- test two-browser realtime

Stage 3 — knowledge verification:

- regenerate Hynoe help index from current site
- run known-answer test set
- fix stale/conflicting site content exposed by the test

Stage 4 — production:

- publish shared UI to public pages
- replace old watch-page chat shell
- monitor errors/reports

Stage 5 — cleanup:

- remove obsolete visitor relay assets/config only after production Global Chat is verified
- keep unrelated Minecraft/Bloom/Discord systems separate

## 20. Files Expected to Change / Be Added

Likely repository changes:

- `assets/site-social.mjs` — new
- `assets/site-social.css` — new
- `assets/site-social-admin.mjs` — new if needed
- `site-admin.html` — new or replaces obsolete chat-admin purpose
- `scripts/build-help-index.mjs` — new
- `data/hynoe-help-index.json` — generated
- `community-rules.html` — update
- `watch.html` — replace old campfire/relay UI integration
- root public HTML pages — add shared social assets where appropriate
- CSP meta headers on public pages — add only required Supabase/backend origins
- tests for frontend validation/retrieval and generated index
- Supabase migrations/functions/policies under a dedicated repository directory, e.g. `supabase/migrations/`

Do not mix this feature implementation into `control-bridge/`.

## 21. User-Only Setup / Authorization

The assistant can write the code, migrations, policies, tests, and deployment configuration.

The user may need to perform only provider/account steps that require direct authorization, such as:

- connecting/authorizing the intended Supabase project if not already connected
- enabling anonymous sign-ins in project auth settings if an API/tool cannot do it safely
- configuring a server-side AI provider credential if the preferred model-backed Help Bot mode is enabled

The site must still support deterministic retrieval fallback if the model credential is not configured.

## 22. Definition of Done

The feature is complete only when all of the following are true:

1. Global Chat is visibly accessible across all intended public pages.
2. Two visitors can exchange messages in realtime without Minecraft, Bloom, or Discord.
3. Messages persist and history reloads.
4. Guest identity/display name works without email/password signup.
5. Presence/online state works.
6. Replies, reactions, reporting, moderation, and announcements work.
7. Admin authorization cannot be self-granted by a guest.
8. Ask Hynoe answers from the current Hynoe knowledge index and returns useful page links.
9. Ask Hynoe has a safe deterministic fallback if model-backed answering is unavailable.
10. Mobile and desktop layouts pass interaction testing.
11. Old website-to-Minecraft relay language/UI is no longer presented as the site chat.
12. No privileged key or secret is exposed in GitHub or browser-delivered code.
13. Production smoke tests pass after deployment.
