# Hynoe SMP Mobile + Sitewide Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a consistent sitewide Hynoe visual shell and a reliable phone-first Watch/Outpost experience with on-site stream playback.

**Architecture:** Add focused shared assets rather than rewriting page content: a final sitewide CSS layer for public pages, a mobile Outpost override layer, and a small Watch video module. Remove the custom touch bridge behavior while preserving save recovery. Update the existing stream CTA behavior and expand automated browser coverage before merging.

**Tech Stack:** Static HTML/CSS/JavaScript, ES modules, Node 22 tests, Playwright Chromium, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-06-mobile-sitewide-refresh-design.md`

## Global Constraints
- Preserve all current page content, SEO metadata, server facts, Hynoe Outpost progression, and local saves.
- Keep global leaderboard uploads disabled.
- Primary stream watching must remain on hynoesmp.com; external YouTube remains secondary only.
- Phone layouts from 320px through 430px must have no horizontal overflow and no clipped mining labels/cards.
- One physical tap or keyboard activation must mine exactly once.

## Review Focus
- 320px devices: twelfth vein and text must remain fully inside the mine scene.
- Touch devices: no duplicate mine caused by synthetic pointer/click interaction.
- Missing/invalid stream data: page stays usable and external fallback remains explicit.
- Long guide-page content: shared shell must not hide headings or overflow horizontally.
- Sticky/fixed mobile navigation and mini-player: must respect safe-area and not cover primary controls.

---

### Task 1: Regression coverage

**Files:**
- Create: `tests/sitewide-mobile-refresh.test.mjs`
- Modify: `tests/browser-mobile.mjs`

**Interfaces:**
- Consumes: current public HTML/CSS/JS behavior.
- Produces: failing tests that define shared refresh inclusion, native tap behavior, unclipped veins, and on-site video playback.

- [ ] Write static tests for shared stylesheet inclusion on all public pages, watch-video wiring, stream CTA destination, and absence of manual pointer activation.
- [ ] Extend Playwright tests for every phone width and every public page.
- [ ] Run `node --test tests/*.test.mjs`; expect the new static tests to fail before implementation.
- [ ] Trigger browser verification; expect the new visual/behavior assertions to fail before implementation.

### Task 2: Mobile Outpost interaction and layout

**Files:**
- Modify: `assets/watch-mobile.mjs`
- Create: `assets/watch-mobile-v2.css`
- Modify via HTML injection: `watch.html`

**Interfaces:**
- Consumes: existing `watch.mjs` click handler and save recovery module.
- Produces: native single-activation mining and flow-based phone grid.

- [ ] Keep save recovery/reload guard in `watch-mobile.mjs`; remove pointerup/onclick interception.
- [ ] Add phone/tablet CSS overrides that make the mine height content-driven, keep cards readable, and place decorative graphics behind controls.
- [ ] Load the override after existing Watch styles with release token `20261006b`.
- [ ] Run static and browser tests; mobile mining assertions pass.

### Task 3: On-site stream player

**Files:**
- Create: `assets/watch-video.mjs`
- Modify: `assets/stream.js`
- Modify via HTML injection: `watch.html`, `index.html`

**Interfaces:**
- Consumes: `data/stream.json` `{videoId,title,status,url}`.
- Produces: primary Hynoe-hosted watch flow; optional explicit YouTube link.

- [ ] Add module that fetches current stream metadata, updates Watch page title/link, and creates a privacy-enhanced YouTube iframe only when the primary play button is activated.
- [ ] Change homepage `data-stream-watch` destination/text to `watch.html#video` / `WATCH HERE ON HYNOE`.
- [ ] Preserve secondary external YouTube link as `OPEN ON YOUTUBE ↗`.
- [ ] Run tests; on-site playback assertion passes without navigation.

### Task 4: Sitewide visual/mobile refresh

**Files:**
- Create: `assets/site-refresh.css`
- Modify via HTML injection: public root HTML pages.

**Interfaces:**
- Consumes: existing `styles.css`, page-specific inline styles, and `common.js` mission/zone markup.
- Produces: shared final visual/mobile layer loaded after existing styles.

- [ ] Add shared shell CSS for headers, heroes, mission cards, page sections, cards, buttons, typography, mobile hotbar/page-map, and safe-area spacing.
- [ ] Inject the stylesheet into `index.html`, `start.html`, `mca.html`, `progression.html`, `economy.html`, `bosses.html`, `join.html`, `modpack.html`, `updates.html`, `modded-minecraft-server.html`, `watch.html`, `privacy.html`, `terms.html`, `data-deletion.html`, and `community-rules.html`.
- [ ] Run browser smoke test at 390px for every page; no overflow and primary content visible.

### Task 5: Full verification and merge

**Files:**
- Modify: `.github/workflows/browser-mobile-verify.yml` only if path coverage requires it.

**Interfaces:**
- Consumes: completed branch.
- Produces: production-ready PR with test evidence.

- [ ] Run full Node suite.
- [ ] Run Playwright mobile/desktop workflow and inspect screenshots.
- [ ] Review PR patch for unrelated changes and temporary automation files.
- [ ] Merge only after both gates are green.
- [ ] Verify GitHub Pages deployment and live `hynoesmp.com` asset/version behavior.
