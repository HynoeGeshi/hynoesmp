# Hynoe Visual + Retention Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the reusable HYNOE visual system, refresh the public Search and Hynoe Page experience, and add privacy-conscious anonymous return loops before the secure account/Command Center phase.

**Architecture:** Keep the existing Phase 1 Next.js search/domain layer intact and add a presentation system above it: reusable brand components and design tokens, shared public chrome, upgraded Search/Page surfaces, then a small versioned browser-retention repository for recent/saved/followed state. Product analytics is isolated behind a typed event adapter so PostHog can be present without coupling product components to the SDK. Auth, page ownership, inquiries, Resend, Stripe state, and RLS remain in the separate Phase 2A implementation plan.

**Tech Stack:** Next.js 16.3.8 App Router, React 19.2.0, TypeScript 5.9.3, CSS, Vitest 3.2.4, Testing Library 16.3.0, Playwright 1.55.0, PostHog browser SDK (exact version pinned at implementation after current-package verification), Render.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-visual-retention-system-design.md`

**Related future spec:** `docs/superpowers/specs/2026-10-06-hynoe-search-phase-2a-owned-pages-command-center-design.md`

## Global Constraints

- Preserve the approved HYNOE wordmark, H/N monogram, oval/ring motif, gold prestige accent, and restrained purple/blue digital accent.
- The premium glow artwork is a marketing treatment, not the only small-size logo.
- `hynoe.net` remains the canonical Hynoe Search domain; `hynoesmp.com` and `hynoeflicks.com` remain independent canonical destinations; `outpost.hynoe.net` remains the intended direct Outpost entry.
- Never fabricate review counts, ratings, verification, availability, pricing, or trust signals.
- No arbitrary JavaScript, raw HTML, or unrestricted CSS from Hynoe Page data.
- Public UI remains usable at 320px without horizontal overflow.
- Primary mobile actions should be approximately 44px touch targets where practical.
- Respect `prefers-reduced-motion` and do not convey critical information by color alone.
- Retention is utility-based: no streaks, fake urgency, endless-scroll traps, or engagement spam.
- Anonymous retention storage must not contain email addresses, inquiry text, or other freeform personal data.
- Organic result order is not altered by payment status.
- This plan does not create or modify Supabase projects, Auth, RLS, Resend, Stripe objects, reviews, Trust Score, or sponsored placement.

## Review Focus

- **320px/mobile layout:** header, search controls, filters, cards, Hynoe Page actions, and retention sections must not cause horizontal overflow; pin with Playwright viewport tests in Tasks 2–4.
- **Unavailable/corrupt browser storage:** private mode, denied storage, malformed JSON, and stale storage versions must degrade to empty retention state rather than break rendering; pin in Task 5.
- **Reduced motion:** users with `prefers-reduced-motion: reduce` must not receive decorative transitions/animations; pin with CSS assertion/browser test in Task 2.
- **Missing optional page data:** a page without tags, service pricing, media, ratings, or verification must not render empty/fake UI; pin in Tasks 3–4.
- **External destination safety:** public CTA rendering must continue to accept only validated HTTPS destinations from the existing page schema and preserve SMP/Flicks canonical destinations; pin in Task 4.

---

### Task 1: HYNOE Brand Assets and Design Tokens

**Files:**
- Create: `public/brand/hynoe-core-mark.png`
- Create: `public/brand/hynoe-premium-mark.png`
- Create: `src/components/brand/hynoe-mark.tsx`
- Create: `src/components/brand/hynoe-wordmark.tsx`
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Test: `tests/smoke/brand.test.tsx`

**Interfaces:**
- Produces: `HynoeMark({ variant?: 'core' | 'premium', size?: 'sm' | 'md' | 'lg' })`
- Produces: `HynoeWordmark({ compact?: boolean })`
- Produces CSS variables for neutral surfaces, gold prestige accents, purple/blue interaction accents, spacing, radii, shadows, and focus rings.
- Consumes no later-task interfaces.

- [ ] **Step 1: Write failing brand tests**

Assert that `HynoeMark` exposes an accessible HYNOE label, the compact mark renders without decorative text, and `HynoeWordmark` renders the protected HYNOE name.

- [ ] **Step 2: Run the brand test and verify RED**

Run: `npm test -- tests/smoke/brand.test.tsx`
Expected: FAIL because brand components/assets do not exist.

- [ ] **Step 3: Derive the two approved logo assets from the user-supplied HYNOE artwork**

Use the existing H/N oval geometry. `core` removes heavy bloom/sparkle dependency and remains readable at compact sizes. `premium` preserves the approved gold/glow language. Do not redesign the monogram into a different symbol.

- [ ] **Step 4: Implement the brand components and token sheet**

Keep UI typography readable and separate from the decorative logo treatment. Import `tokens.css` once from `globals.css`.

- [ ] **Step 5: Run brand tests and full unit suite**

Run: `npm test`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add public/brand src/components/brand src/styles/tokens.css src/app/globals.css src/app/layout.tsx tests/smoke/brand.test.tsx
git commit -m "feat: establish Hynoe visual system"
```

### Task 2: Shared Public Chrome and Homepage Return Surface

**Files:**
- Create: `src/components/layout/site-header.tsx`
- Create: `src/components/home/home-hero.tsx`
- Create: `src/components/home/originals-grid.tsx`
- Create: `src/components/home/returning-discovery.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/smoke/home.test.tsx`
- Modify: `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `HynoeMark`, `HynoeWordmark`, design tokens from Task 1.
- Consumes later Task 5 interface through `ReturningDiscovery`; until Task 5 lands it renders the neutral empty state only.
- Produces: `SiteHeader({ searchDefaultValue?: string, activeNav?: 'search' | 'creatorops' | 'outpost' })`.

- [ ] **Step 1: Add failing homepage tests**

Assert the dominant search control, clear independent-discovery promise, Hynoe Originals, category shortcuts, HYNOE brand header, and no requirement to sign in before searching.

- [ ] **Step 2: Add failing mobile/reduced-motion browser checks**

At 320px assert no horizontal overflow and usable search CTA. Emulate reduced motion and assert decorative motion is disabled by the relevant CSS media query.

- [ ] **Step 3: Run targeted tests and verify RED**

Run: `npm test -- tests/smoke/home.test.tsx && npx playwright test e2e/home.spec.ts`
Expected: FAIL on new header/home requirements.

- [ ] **Step 4: Implement shared header and refreshed homepage**

Use immersive dark discovery surfaces, restrained gold brand moments, and purple/blue interactive emphasis. Keep CreatorOps visible as a featured Hynoe vertical rather than making the homepage a CreatorOps landing page.

- [ ] **Step 5: Verify targeted tests and full suite**

Run: `npm test && npx playwright test e2e/home.spec.ts`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout src/components/home src/app/page.tsx src/app/globals.css tests/smoke/home.test.tsx e2e/home.spec.ts
git commit -m "feat: refresh Hynoe discovery homepage"
```

### Task 3: High-Signal Search Results and Mobile Filters

**Files:**
- Modify: `src/app/search/page.tsx`
- Modify: `src/components/search/search-form.tsx`
- Modify: `src/components/search/filter-bar.tsx`
- Modify: `src/components/search/result-card.tsx`
- Create: `src/components/search/mobile-filter-panel.tsx`
- Create: `tests/smoke/result-card.test.tsx`
- Create: `e2e/search.spec.ts`

**Interfaces:**
- Consumes: `SiteHeader` from Task 2 and existing `searchPages(...)` domain interface.
- Produces result-card click hooks consumed by Task 6 analytics.
- Produces filter UI based only on page data already present in the Phase 1 schema.

- [ ] **Step 1: Write failing result-card tests**

Assert name, real page type/category, summary, available tags only, and one primary Hynoe Page CTA. Assert no rating/verification/price UI appears when those fields do not exist.

- [ ] **Step 2: Write failing Search browser tests**

Cover blank discovery, a known `photographer` query, zero-results state, and 320px filter behavior without a permanent sidebar or overflow.

- [ ] **Step 3: Run targeted tests and verify RED**

Run: `npm test -- tests/smoke/result-card.test.tsx && npx playwright test e2e/search.spec.ts`
Expected: FAIL on the new structured layout/mobile behavior.

- [ ] **Step 4: Implement Search UI refresh**

Keep deterministic ranking unchanged. Make filters available only for supported data, place mobile filters in a collapsible sheet/panel, and retain neutral search access regardless of prior behavior.

- [ ] **Step 5: Verify targeted tests and full suite**

Run: `npm test && npx playwright test e2e/search.spec.ts`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/app/search src/components/search tests/smoke/result-card.test.tsx e2e/search.spec.ts
git commit -m "feat: upgrade Hynoe search results"
```

### Task 4: Modern Mini-Site Hynoe Page Renderer

**Files:**
- Modify: `src/app/p/[slug]/page.tsx`
- Modify: `src/components/page/page-shell.tsx`
- Modify: `src/components/page/module-renderer.tsx`
- Create: `src/components/page/page-header.tsx`
- Create: `src/components/page/page-actions.tsx`
- Create: `tests/smoke/page-shell.test.tsx`
- Create: `e2e/page.spec.ts`

**Interfaces:**
- Consumes: existing validated `HynoePage` / `PageModule` types and HTTPS validation from Phase 1.
- Consumes: `SiteHeader`, brand components, tokens.
- Produces save/follow action mount point consumed by Task 5.
- Produces page-view hook consumed by Task 6.

- [ ] **Step 1: Write failing page-shell tests**

Assert identity header, category context, summary/description, safe official destination CTA, only modules with real data, and no fake rating/verification/pricing indicators.

- [ ] **Step 2: Add canonical-domain regression tests**

Assert Hynoe SMP points to `https://hynoesmp.com`, Hynoe Flicks points to `https://hynoeflicks.com`, and invalid/non-HTTPS destinations remain rejected by existing schema/runtime tests.

- [ ] **Step 3: Add 320px Hynoe Page browser test and verify RED**

Run: `npm test -- tests/smoke/page-shell.test.tsx && npm run test:domain && npx playwright test e2e/page.spec.ts`
Expected: FAIL on new page presentation requirements while existing URL-safety tests remain meaningful.

- [ ] **Step 4: Implement page redesign**

Make each public page feel like a small modern website: strong identity block, primary/official destination actions, structured modules, responsive content hierarchy, and category-adaptive accents without changing core HYNOE geometry.

- [ ] **Step 5: Verify targeted tests and full suite**

Run: `npm test && npm run test:domain && npx playwright test e2e/page.spec.ts`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/app/p src/components/page tests/smoke/page-shell.test.tsx e2e/page.spec.ts
git commit -m "feat: redesign public Hynoe pages"
```

### Task 5: Anonymous Recent, Save, and Follow Retention Primitives

**Files:**
- Create: `src/domain/retention/types.ts`
- Create: `src/domain/retention/browser-retention-store.ts`
- Create: `src/components/retention/save-follow-controls.tsx`
- Create: `src/components/retention/recent-discovery.tsx`
- Modify: `src/components/search/search-form.tsx`
- Modify: `src/components/search/result-card.tsx`
- Modify: `src/components/page/page-shell.tsx`
- Modify: `src/components/home/returning-discovery.tsx`
- Create: `tests/smoke/retention-store.test.ts`
- Create: `e2e/retention.spec.ts`

**Interfaces:**
- Produces: `RetentionStateV1 = { recentQueries: string[]; recentPageSlugs: string[]; savedPageSlugs: string[]; followedPageSlugs: string[] }`.
- Produces: `readRetentionState(): RetentionStateV1`, `recordQuery(query: string): void`, `recordPageView(slug: string): void`, `toggleSaved(slug: string): boolean`, `toggleFollowed(slug: string): boolean`, `clearRetentionState(): void`.
- Storage key: `hynoe.retention.v1`.
- Maximums: 10 recent queries, 12 recent page slugs; saved/followed collections de-duplicate slugs.
- Consumes no email, account ID, message text, or exact location.

- [ ] **Step 1: Write failing repository tests**

Cover empty state, de-duplication, caps, malformed JSON, stale/unknown shape, unavailable storage, and clear behavior.

- [ ] **Step 2: Run retention tests and verify RED**

Run: `npm test -- tests/smoke/retention-store.test.ts`
Expected: FAIL because the retention repository does not exist.

- [ ] **Step 3: Implement minimal versioned browser repository**

Wrap storage calls in safe read/write guards. Any failure returns empty state and does not block search/page rendering.

- [ ] **Step 4: Add save/follow/recent UI and native-search recording**

Anonymous save/follow is device-local in this phase. Make that clear in accessible helper copy rather than implying account sync. Home shows return sections only when useful data exists.

- [ ] **Step 5: Add browser test for return behavior**

Search, visit a Page, save it, reload `/`, and assert recent/saved discovery appears. Clear local storage and assert the neutral first-visit homepage returns.

- [ ] **Step 6: Verify full suite**

Run: `npm test && npx playwright test e2e/retention.spec.ts`
Expected: PASS, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/domain/retention src/components/retention src/components/search src/components/page src/components/home tests/smoke/retention-store.test.ts e2e/retention.spec.ts
git commit -m "feat: add useful anonymous return loops"
```

### Task 6: Privacy-Conscious PostHog Event Adapter

**Files:**
- Modify: `package.json`
- Modify: lockfile generated by package manager
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/analytics/posthog-provider.tsx`
- Create: `src/lib/analytics/track-event.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/search/search-form.tsx`
- Modify: `src/components/search/result-card.tsx`
- Modify: `src/components/page/page-shell.tsx`
- Modify: `src/components/retention/save-follow-controls.tsx`
- Create: `tests/smoke/analytics-events.test.ts`

**Interfaces:**
- Produces: `HynoeAnalyticsEvent` union for `search_submitted`, `search_result_clicked`, `page_viewed`, `page_saved`, `page_followed`.
- Produces: `trackEvent(event: HynoeAnalyticsEvent, properties?: Record<string, string | number | boolean>): void`.
- Public event properties must not contain email, inquiry text, exact location, or raw sensitive freeform content.
- Search events use metadata such as query length, selected filter, and result count rather than sending raw query text in this phase.
- Missing PostHog configuration makes `trackEvent` a no-op and never breaks navigation.

- [ ] **Step 1: Verify current PostHog browser package/version from official/current package source and pin it**

Do not install an unpinned `latest` dependency.

- [ ] **Step 2: Write failing event-contract tests**

Assert allowed event names/properties, raw query exclusion, and safe no-op behavior without environment configuration.

- [ ] **Step 3: Run analytics tests and verify RED**

Run: `npm test -- tests/smoke/analytics-events.test.ts`
Expected: FAIL because analytics adapter does not exist.

- [ ] **Step 4: Implement provider + adapter and instrument the five public events**

Product components call `trackEvent`; they do not import PostHog directly.

- [ ] **Step 5: Run full unit suite and production build**

Run: `npm test && npm run build`
Expected: PASS/build exit 0 with analytics configuration optional.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/analytics src/app/layout.tsx src/components/search src/components/page src/components/retention tests/smoke/analytics-events.test.ts
git commit -m "feat: instrument Hynoe public funnel"
```

### Task 7: Release Verification and Render Deployment

**Files:**
- Modify: `e2e/home.spec.ts`
- Modify: `e2e/search.spec.ts`
- Modify: `e2e/page.spec.ts`
- Modify: `e2e/retention.spec.ts`
- Create: `docs/release/visual-retention-checklist.md`
- Modify deployment bundle on GitHub branch: `hynoe-search-render-app`

**Interfaces:**
- Consumes every public route and interface from Tasks 1–6.
- Produces a verified Render release on existing service `hynoe-search` (`srv-db2j56qj9qps73ehf9j0`).

- [ ] **Step 1: Add final cross-route browser checks**

Cover homepage -> search -> result -> page navigation, 320px and desktop widths, keyboard-visible focus, reduced motion, local save/recent return behavior, and SMP/Flicks external canonical CTAs.

- [ ] **Step 2: Run all local verification**

Run: `npm test && npm run test:domain && npm run build && npm run test:e2e`
Expected: all commands exit 0; no skipped critical route checks.

- [ ] **Step 3: Complete release checklist**

Document test counts, build result, mobile overflow result, accessibility smoke checks, canonical URL checks, analytics no-PII review, and the exact commit deployed.

- [ ] **Step 4: Update the isolated Render deployment bundle/branch**

Do not merge Search code into the SMP `main` branch. Update only `hynoe-search-render-app`; auto-deploy is already enabled for that branch.

- [ ] **Step 5: Verify Render deployment state and public routes**

Use Render deploy/events/logs to require `live`/healthy status, then fetch the public homepage, Search route, and all three flagship Page routes. Do not attach `hynoe.net` until the new release is healthy.

- [ ] **Step 6: Commit release evidence**

```bash
git add e2e docs/release/visual-retention-checklist.md
git commit -m "test: verify Hynoe visual retention release"
```

## Deferred to the Separate Phase 2A Implementation Plan

The following are intentionally not part of this plan even though the visual system prepares for them:
- dedicated Hynoe Search Supabase project creation
- passwordless authentication
- `profiles`, `pages`, `page_members`, and `inquiries` persistence
- RLS and page-member authorization
- authenticated Command Center routes
- editable owned Pages
- inquiry submission/status
- Resend notifications
- Stripe account/customer linkage
- owner recommendations backed by persistent account/page data

Those requirements are governed by `2026-10-06-hynoe-search-phase-2a-owned-pages-command-center-design.md` and receive their own implementation plan after this foundation is verified.
