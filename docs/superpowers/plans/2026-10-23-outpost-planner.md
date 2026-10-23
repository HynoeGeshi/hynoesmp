# Outpost goals, crew presets and offline recap Implementation Plan

> **For agentic workers:** Use the executing-plans workflow. Steps are test-first; independent pure modules may be delegated with separate file ownership.

**Goal:** Make existing Outpost progression easier to plan and understand while preserving every existing save and payout.

**Architecture:** Add small, dependency-free modules for read-only goal descriptions, validated crew presets, and measured restore/earnings reports. Mount one planner panel and a crew preset panel through the existing browser controller. Store optional planner preferences separately from the existing game save. Keep current save keys, format, recovery authority, rewards, eight-hour cap and run locks.

**Tech Stack:** Existing browser ES modules, HTML/CSS, Node tests and Playwright browser checks.

**Spec:** User approved the three proposed additions and requested tests, live publication and preservation of all progress. Pinned goals show remaining costs and source shortcuts; presets save the player's current crew with previews; recap explains already-credited restore earnings and actual successful local-save time.

## Global Constraints

- No new dependency, account, currency, payout or server/player-save migration.
- No automatic crew or station reassignment. Presets must respect cave, relic-hunt and Guardian locks; unavailable crew produce an explanatory refusal without mutation.
- A recap observes exactly one existing restore; it must never tick, claim or grant rewards a second time.
- Optional preference corruption/storage failure must not replace or delete the current game save.
- Preserve existing art, navigation, legal policies, gameplay-only reward rules and local-save privacy.
- Back up reviewed source before product edits. No backup rotation/deletion or recurring tasks.

## Review Focus

1. Older, corrupted or future-dated saves: truthful capped recap, no invented credit or progress loss.
2. Active encounters and stationed/deleted crew: atomic preset refusal with no partial reassignment.
3. Completed or invalid pinned targets: stable completion or safe empty state, never a moving cost target.
4. Storage denied/full: real save warning, no false success timestamp; gameplay remains usable.
5. Phone widths and keyboard navigation: reachable controls, no overflow, no modal blocking play.

### Task 1: Goals and preset models

**Files:** new `assets/outpost-goals.mjs`, `assets/outpost-crew-presets.mjs` and corresponding Node tests.

**Interfaces:** goalOptions(state) -> [{id,label}]; goalView(state,id) -> null or {id,title,detail,target,requirements:[{label,have,need,remaining}],sources:[{label,target}],ready,completed}. Stable IDs encode the target upgrade level. Crew helpers normalize bounded three-slot presets, capture current lineup, preview its actual bonuses, and atomically apply only owned, available crew when no encounter is active.

- [x] Add behavior tests and demonstrate missing-feature failures.
- [x] Implement pure goal calculations against existing game costs and safe crew operations against existing rules.
- [x] Verify focused tests, including invalid input, target completion, station and encounter locks.

### Task 2: Restore recap, preferences and UI

**Files:** new `assets/outpost-recap.mjs`, `assets/outpost-planner.mjs`, `assets/outpost-planner.css`; modify `watch.html`, `assets/watch.mjs`, cache-version assertions as necessary.

- [x] Test read-only recap deltas, cap/clock handling, preferences and successful/failed-save status before implementation.
- [x] Add a restore observer around the existing single tick; keep original restore behavior and credited values unchanged.
- [x] Add persistent pinned-goal controls, three named preset slots with previews, and a dismissible earnings recap/save status. Planner preferences use `hynoeOutpostPlannerV1`; current game uses its unchanged key.
- [x] Verify isolated old/new save reload, storage failure and touch/keyboard controls.

### Task 3: Verify and publish

- [x] Run the complete Node suite and mobile/desktop browser suites with synthetic saves.
- [x] Review the complete diff independently and fix material findings with regression tests.
- [ ] Open/attach PR, verify checks, merge, verify deployment and served files, capture a public screenshot.
- [ ] Keep rollback instructions and evidence private; roll back source only, never player saves.

## Execution record

- Reused the existing clean linked worktree from main commit `25f0d91`; baseline 301 tests passed.
- Source ZIP verified with critical-file hashes and full ZIP integrity/readback in both existing backup stores. No sets rotated or removed.
- Goals and presets were delegated into separate pure modules. Root integrated the browser controller, restore observer and separate preferences. Their only shared boundary is the existing normalized game state; no new game-save schema field was added.
- Completed goal preferences latch the observed completion, preserving a finished workshop target across Legacy while the existing machine reset still applies normally.
- Capture is read-only and permitted during encounters; applying any preset remains locked. This keeps saving a plan distinct from changing the active team.
- Final review P2 fixed: a denied legacy migration write no longer discards the already-restored session. Browser regression reproduced `0 owned` before repair and now retains `3 owned`, leaves the original legacy data intact, and reports the save failure.
- Final Node suite: 334/334. Browser checks cover all three presets, pin/source routes, reload, completed-target Legacy/reload, blocked current and legacy writes; general mobile/desktop suite, six first-load widths, and restored cave play pass.
