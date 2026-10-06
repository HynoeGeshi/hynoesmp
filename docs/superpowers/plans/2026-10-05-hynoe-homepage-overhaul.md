# Hynoe Homepage Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Hynoe SMP homepage feel as polished and coherent as Hynoe Outpost while making the first decision—join, get the pack, or watch/play—faster on desktop and mobile.

**Architecture:** Preserve the current crawlable static homepage and existing world-guide content, but add a dedicated homepage visual layer and simplify the top information hierarchy. Reuse existing imagery and content; do not fabricate live server telemetry. Keep the underlying system pages and SEO content reachable.

**Tech Stack:** Static HTML/CSS, existing `assets/common.js`, Node 22 `node:test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-05-hynoe-outpost-overhaul-design.md`

## Global Constraints

- Work only on `hynoe-outpost-overhaul-2026-10-05` until review/merge.
- Preserve the existing homepage canonical URL, title/description, CSP, ownership notice, Minecraft/Mojang non-affiliation disclosure, and growth/discovery link.
- Above-the-fold priority is exactly: **Join Hynoe SMP**, **Get the Pack**, **Watch & Play**.
- Do not show fake online-player counts, uptime, live campaign state, ratings, or other unverified telemetry.
- Hynoe Outpost remains clearly separate from Hynoe SMP while visually belonging to the HYNOE family.
- Homepage must remain usable without hover.
- No horizontal page overflow on narrow phones.
- Mobile navigation/actions must be thumb-friendly.
- Existing world-guide/system links remain reachable.

## Review Focus

- 320px viewport: hero buttons and navigation must not overflow; Task 2 adds stacked/scroll-safe rules.
- Visitors must understand the three primary actions without competing Discord/support buttons in the hero; Task 1 pins the hero CTA contract.
- System dashboard must navigate to real pages rather than pretend to be live telemetry; Task 1 checks canonical internal links and copy.
- Hynoe Outpost must not be confused with Minecraft itself; Task 2 keeps product labels distinct and the non-affiliation footer intact.
- Existing growth entry link `modded-minecraft-server.html` must survive the redesign; Task 1 tests it explicitly.

---

### Task 1: Homepage regression contract

**Files:**
- Create: `tests/home-overhaul.test.mjs`

**Interfaces:**
- Consumes: `index.html`, `assets/styles.css`.
- Produces: structural assertions for Task 2.

- [ ] **Step 1: Write failing test** asserting:
  - `index.html` loads `assets/home-outpost.css` after `assets/styles.css`.
  - hero has exactly three `.hero-actions` links and their destinations are `join.html`, `modpack.html`, and `watch.html`.
  - hero CTA copy includes `JOIN HYNOE SMP`, `GET THE PACK`, and `WATCH & PLAY`.
  - a `.world-dashboard` exists with links to `progression.html`, `mca.html`, `economy.html`, and `bosses.html`, plus a Genesis/progression link.
  - dashboard copy uses system labels, not fake online/uptime/player-count claims.
  - Hynoe Outpost feature is present and links to `watch.html#game`.
  - `modded-minecraft-server.html` remains linked.
  - footer still contains the Mojang/Microsoft non-affiliation statement.
  - `assets/home-outpost.css` contains mobile rules, grid collapse, 44px minimum interactive sizing, and reduced-motion handling.
- [ ] **Step 2: Push test-only change and confirm RED** while existing tests remain green.

### Task 2: Build the polished world hub

**Files:**
- Create: `assets/home-outpost.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: existing home markup/content and Task 1 contract.
- Produces: cleaner Hynoe visual system and hierarchy.

- [ ] **Step 1: Patch hero actions** to exactly three primary CTAs in this order:
  1. `JOIN HYNOE SMP` → `join.html`
  2. `GET THE PACK` → `modpack.html`
  3. `WATCH & PLAY` → `watch.html`
  Move Discord/support access out of hero prominence; keep them elsewhere on the page/header.
- [ ] **Step 2: Convert the existing status strip into `.world-dashboard`** with real navigation cards for Genesis/Progression, Campaign/Progression, Village Life, Economy, and Bosses/Gear. Use descriptive static facts only.
- [ ] **Step 3: Refine Hynoe Outpost feature copy** so it says it is an original Hynoe browser game and summarizes `mine → build → collect crew → explore → legacy`, with one clear play CTA.
- [ ] **Step 4: Load `assets/home-outpost.css` after the existing stylesheet.**
- [ ] **Step 5: Create `assets/home-outpost.css`** that:
  - adopts the dark mineral/forest/gold Hynoe Outpost palette without copying game layout literally;
  - turns the hero into a cleaner glass/metal world gateway over the existing cover art;
  - styles dashboard cards as clear navigational modules;
  - makes quick-start, updates, Outpost, world systems, broadcast, download, support, and portal sections visually consistent;
  - converts the bottom fixed hotbar into a less intrusive horizontal navigation rail on smaller screens;
  - stacks primary hero CTAs on narrow phones and maintains >=44px interaction targets;
  - uses 1-column cards on narrow phones, 2-column where space permits, and multi-column desktop layouts;
  - avoids hover-only information;
  - includes safe overflow handling and reduced-motion rules.
- [ ] **Step 6: Run `node --test tests/home-overhaul.test.mjs` and full `node --test tests/*.test.mjs`.**

### Task 3: Browser/visual gate

**Files:**
- No production file requirement.

- [ ] **Step 1: Verify desktop homepage** for meaningful above-fold hierarchy, no console errors, and working primary CTAs.
- [ ] **Step 2: Verify 320, 360, 390, and 430px widths** for no horizontal overflow, readable headline, stacked CTAs, reachable navigation, and 44px interactive targets.
- [ ] **Step 3: Verify links to progression, villages, economy, bosses, Outpost, join, and pack.**
- [ ] **Step 4: Final full Node suite must pass before merge.**
