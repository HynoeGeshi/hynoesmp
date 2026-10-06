# Hynoe Global Privacy Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an accurate worldwide privacy/legal surface and stop automatic external leaderboard submissions until Hynoe has an operational rights/deletion path.

**Architecture:** Keep all gameplay local and fully functional. Add static legal pages and navigation links, then place the existing external leaderboard behind a code-level privacy hold while retaining local legend scoring. Do not add email, cloud accounts, DOB collection, analytics, advertising, or new vendors in this phase.

**Tech Stack:** Static HTML/CSS, browser ES modules, Node 22 `node:test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-05-hynoe-global-account-privacy-addendum.md`

## Global Constraints

- Local Hynoe Outpost gameplay remains available without account/email.
- No full DOB or identity verification is introduced in this phase.
- No external leaderboard score/player-ID requests may occur while `GLOBAL_BOARD_ENABLED` is false.
- Existing local Legend score/tier/callsign UI remains functional.
- Legal text must describe current behavior, not future promises or guarantees.
- Do not claim legal compliance certification or guaranteed security.
- Legal pages must carry the existing CSP/referrer/copyright/non-affiliation controls.
- Cloud accounts remain disabled.

## Review Focus

- A page load must not call the external leaderboard endpoint while privacy hold is active.
- The leaderboard UI must clearly say local scoring still works and why global sync is paused.
- Legal pages must not claim emails/cloud saves are currently collected.
- A user must have an understandable current-data deletion path for browser-local data and a route to contact Hynoe privately about legacy data.
- Footer/legal links must be reachable from both homepage and Watch & Play.

---

### Task 1: Privacy regression contract

**Files:**
- Create: `tests/privacy-surface.test.mjs`

- [ ] Assert `privacy.html`, `terms.html`, `data-deletion.html`, and `community-rules.html` exist and include CSP/referrer/copyright/non-affiliation text.
- [ ] Assert homepage and Watch & Play link Privacy, Terms, and Data Deletion.
- [ ] Assert Privacy accurately says cloud accounts are not live and local game data is stored on-device.
- [ ] Assert `watch.mjs` contains `GLOBAL_BOARD_ENABLED=false` and only calls `connectLeaderboard()` under that gate.
- [ ] Assert leaderboard UI says global sync is temporarily paused for privacy work and local scoring continues.
- [ ] Push tests and confirm RED before implementation.

### Task 2: Publish current-state legal pages

**Files:**
- Create: `assets/legal.css`
- Create: `privacy.html`
- Create: `terms.html`
- Create: `data-deletion.html`
- Create: `community-rules.html`

- [ ] Create plain-language pages that distinguish current local storage, paused global leaderboard, inactive website chat relay, third-party links/embedded YouTube behavior, and future cloud accounts.
- [ ] Privacy page explains current data categories, purposes, local storage, provider technical request data, third-party links, minors/global product posture, rights request route, retention principles, and policy-change date.
- [ ] Terms page covers acceptable use, original Hynoe IP, Minecraft/Mojang non-affiliation, third-party services, no warranty/availability guarantee, account/social restrictions when later enabled, and attorney-review disclaimer for commercial expansion.
- [ ] Data deletion page gives browser-local deletion steps and a private-contact process for legacy server-side data requests without asking users to post identifiers publicly.
- [ ] Community Rules page covers harassment, hate, threats, sexual content involving minors, doxxing/private info, impersonation, scams/malware, cheating/abuse, moderation, and reporting.

### Task 3: Pause external leaderboard transmission

**Files:**
- Modify: `assets/watch.mjs`
- Modify: `watch.html`
- Modify: `index.html`

- [ ] Add `const GLOBAL_BOARD_ENABLED=false` near leaderboard state.
- [ ] Initialize leaderboard state as `LOCAL ONLY · PRIVACY HOLD` when disabled.
- [ ] Guard `queueLeaderboardSync`, visibility sync, periodic sync, and initial `connectLeaderboard()` so no endpoint request occurs while disabled.
- [ ] Keep local `G.legendStatus` and local fallback row intact.
- [ ] Update leaderboard copy to say global sync is paused while worldwide privacy/deletion controls are completed; local Legend score continues.
- [ ] Add Privacy/Terms/Data Deletion links to homepage and Watch & Play footers.

### Task 4: Verification gate

- [ ] Run `node --check assets/watch.mjs`.
- [ ] Run `node --test tests/privacy-surface.test.mjs`.
- [ ] Run full `node --test tests/*.test.mjs`.
- [ ] Verify no new public HTML page fails the security policy test.
- [ ] Do not re-enable the external global board until there is an operational access/deletion/export path and legal review of the worldwide data flow.
