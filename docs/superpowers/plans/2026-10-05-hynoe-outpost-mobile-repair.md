# Hynoe Outpost Mobile Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair Hynoe Outpost mining on mobile, make the Watch & Play game comfortably responsive, rename visible game branding from Deep & Deeper to Hynoe Outpost, and preserve existing local saves.

**Architecture:** Keep the existing game logic intact. Add a focused mobile stylesheet and touch-input enhancement module, patch the existing HTML to load them, and migrate the local save key in-place with backward compatibility. Use GitHub Actions on the isolated overhaul branch to prove RED then GREEN before any merge.

**Tech Stack:** Static HTML/CSS, browser ES modules, Node 22 `node:test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-05-hynoe-outpost-overhaul-design.md`

## Global Constraints

- Work only on `hynoe-outpost-overhaul-2026-10-05` until final review/merge approval.
- No cloud-save, email, Supabase, or personal-data collection in this plan.
- Desktop mine remains 4 columns.
- Narrow phones use 2 mine columns; larger phones/small tablets use 3 columns.
- Preserve keyboard activation and native button semantics.
- A single touch/pen mining action must result in one mine action.
- Do not disable normal page scrolling.
- Preserve `prefers-reduced-motion` support.
- Keep the mini-player usable and dismissible without covering primary mobile game controls.
- Existing local saves under `hynoeDeepDeeperV1` must continue loading; new writes use `hynoeOutpostV1`.
- Visible product name is **Hynoe Outpost**; do not use ®.

## Review Focus

- Synthetic click after a touch pointer event must not double-mine; Task 2 tests the touch wrapper contract.
- Keyboard-generated clicks must continue mining; Task 2 tests that `detail === 0` remains allowed.
- 320px screens must not keep a 4-column mine; Task 1 tests the explicit 2-column rule.
- Returning players with only the legacy save key must migrate without losing progress; Task 3 tests both key names and migration code.
- Mini-player mobile dimensions/position must not occupy most of a phone viewport; Task 1 tests capped dimensions and safe-area positioning.

---

### Task 1: Add mobile regression contract

**Files:**
- Create: `tests/mobile-outpost.test.mjs`
- Create: `.github/workflows/outpost-overhaul-tests.yml`

**Interfaces:**
- Consumes: existing `watch.html`, `assets/watch.css`, `assets/watch.mjs`.
- Produces: failing regression assertions that Task 2/3 must satisfy.

- [ ] **Step 1: Add branch CI** that runs `node --test tests/*.test.mjs` on every push to `hynoe-outpost-overhaul-2026-10-05` using Node 22.
- [ ] **Step 2: Write `tests/mobile-outpost.test.mjs`** asserting:
  - `watch.html` links `assets/watch-mobile.css` and `assets/watch-mobile.mjs`.
  - visible game heading contains `HYNOE OUTPOST` and no `DEEP <em>&</em> DEEPER`.
  - `assets/watch-mobile.css` contains explicit 2-column narrow-phone and 3-column larger-mobile/tablet vein-grid rules, touch target sizing, horizontal snap/overflow rules for tabs, safe-area mini-player positioning, and reduced-motion handling.
  - `assets/watch-mobile.mjs` binds pointer handling to `.vein`, distinguishes touch/pen from mouse, suppresses the immediate synthetic click, and allows keyboard clicks.
  - `assets/watch.mjs` contains `hynoeOutpostV1`, `LEGACY_KEY='hynoeDeepDeeperV1'`, and migration logic.
  - `index.html` no longer advertises the game as `DEEP<br>&amp; DEEPER`.
- [ ] **Step 3: Push test-only commit and inspect CI.**
  - Expected: new `mobile-outpost.test.mjs` fails because the mobile assets/rebrand/migration do not exist yet.

### Task 2: Repair mobile presentation and touch input

**Files:**
- Create: `assets/watch-mobile.css`
- Create: `assets/watch-mobile.mjs`
- Modify: `watch.html`

**Interfaces:**
- Consumes: Task 1 regression contract.
- Produces: responsive mobile mine and pointer wrapper loaded by `watch.html`.

- [ ] **Step 1: Create `assets/watch-mobile.css`** with:
  - `@media (max-width: 479px)` → `.vein-grid{grid-template-columns:repeat(2,minmax(0,1fr))}`.
  - `@media (min-width:480px) and (max-width:899px)` → `.vein-grid{grid-template-columns:repeat(3,minmax(0,1fr))}`.
  - mobile vein minimum touch size at least 88px high, generous gap, `touch-action:manipulation` on interactive game buttons only.
  - small-screen stats/hud/guardian/field-order/room-card/operations/crew/research/campaign reflow.
  - `.tabs` horizontal overflow with `scroll-snap-type:x proximity`; tab buttons `scroll-snap-align:start` and `flex:0 0 auto`.
  - mobile mini-player capped around 176x99 on narrow phones and 224x126 on larger mobile, right-aligned with `env(safe-area-inset-bottom)` and matching dock-toggle placement.
  - landscape-phone reductions for decorative mine effects and vertical spacing.
  - reduced-motion rule disabling new animations/transitions.
- [ ] **Step 2: Create `assets/watch-mobile.mjs`** exposing no globals and performing idempotent binding:
  - `bindVein(button)` stores original `onclick` once.
  - touch/pen primary `pointerup` calls the original handler exactly once and records a short suppression timestamp.
  - the wrapped `onclick` ignores the immediate synthetic click from that pointer activation but passes mouse and keyboard clicks; keyboard clicks (`event.detail === 0`) are always allowed.
  - a `MutationObserver` binds veins added after module evaluation.
- [ ] **Step 3: Patch `watch.html`** to load `watch-mobile.css` after `watch.css` and `watch-mobile.mjs` after `watch.mjs`, and change the visible heading to `HYNOE OUTPOST`.
- [ ] **Step 4: Run `node --test tests/mobile-outpost.test.mjs` and full `node --test tests/*.test.mjs`.**
  - Expected: mobile presentation/input assertions pass; any remaining failure should be only Task 3 migration/rebrand assertions.

### Task 3: Preserve saves and finish visible rebrand

**Files:**
- Modify: `assets/watch.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: existing game `G.restore`/`save()` behavior.
- Produces: `hynoeOutpostV1` as current save key with transparent legacy migration.

- [ ] **Step 1: Patch save initialization** so `KEY='hynoeOutpostV1'` and `LEGACY_KEY='hynoeDeepDeeperV1'`; restore current save first, else legacy save, and after a successful legacy restore write the restored state to the new key.
- [ ] **Step 2: Leave the legacy key untouched** during the compatibility window; all future normal `save()` writes target the new key only.
- [ ] **Step 3: Patch `index.html` viewer-game branding** from Deep & Deeper to Hynoe Outpost without redesigning the rest of the homepage in this plan.
- [ ] **Step 4: Run `node --check assets/watch.mjs`, `node --check assets/watch-mobile.mjs`, `node --test tests/mobile-outpost.test.mjs`, then `node --test tests/*.test.mjs`.**
  - Expected: all pass.

### Task 4: Mobile browser verification gate

**Files:**
- No production file requirement; record findings in PR/ledger.

**Interfaces:**
- Consumes: Tasks 2–3 implementation.
- Produces: evidence for Gate A.

- [ ] **Step 1: Verify page at 320, 360, 375, 390, 412, and 430px portrait widths.**
  - Expected: no horizontal page overflow; mine is 2 columns below 480px; all veins remain reachable and readable.
- [ ] **Step 2: Verify representative 480–899px mobile/tablet width.**
  - Expected: mine is 3 columns.
- [ ] **Step 3: Verify landscape phone viewport.**
  - Expected: critical controls remain usable and decorative effects do not dominate the viewport.
- [ ] **Step 4: Repeatedly mine by touch/pointer emulation and keyboard.**
  - Expected: one action per touch; keyboard still activates buttons; scrolling works.
- [ ] **Step 5: Dock/dismiss mini-player while mining.**
  - Expected: player remains visible/dismissible without covering the core mine interaction.
- [ ] **Step 6: Final full test run.**
  - Run: `node --test tests/*.test.mjs`
  - Expected: PASS with no failures.
