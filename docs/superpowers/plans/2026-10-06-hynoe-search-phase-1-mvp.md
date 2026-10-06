# Hynoe Search Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first standalone Hynoe Search MVP at `hynoe.net` with searchable, structured Hynoe Pages and three production flagship entries: Hynoe Outpost, Hynoe SMP, and Hynoe Flicks.

**Architecture:** Build Hynoe Search as a separate Next.js/TypeScript application and deployment, isolated from Hynoe SMP and unrelated automation systems. Phase 1 uses typed, server-owned seed data and a deterministic in-app search/ranking layer so the public product can launch before accounts, reviews, billing, or a new Supabase project are required. The interfaces intentionally mirror the later database model so Phase 2 can replace the repository implementation without rewriting page rendering or search UI.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Testing Library, Playwright, Vercel; later phases add a dedicated Supabase project behind the repository interfaces.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-search-platform-design.md`

## Global Constraints

- `hynoe.net` is the Hynoe Search canonical platform domain.
- `hynoesmp.com` remains the standalone canonical Hynoe SMP site.
- `hynoeflicks.com` remains the standalone canonical Hynoe Flicks site.
- `outpost.hynoe.net` is the direct Hynoe Outpost entry point.
- Hynoe Search must be a separate deployable application and repository from Hynoe SMP.
- Hynoe Search must not share privileged runtime access, secrets, databases, or administrative credentials with Hynoe SMP, Hynoe Outpost, or unrelated automation systems.
- Standard hosted pages use `hynoe.net/p/<slug>`.
- Page customization must use validated modules; no arbitrary executable HTML, JavaScript, or unscoped CSS.
- Organic ranking must be relevance/trust based and must not be silently purchasable.
- Hynoe SMP and Hynoe Flicks are represented in Hynoe Search but retain their independent canonical websites.
- Phase 1 does not enable public account creation, user-generated reviews, monetization, or arbitrary third-party page creation.

## Review Focus

- Empty, whitespace-only, or punctuation-only search input should never throw and should return a useful discovery state.
- Search terms with mixed case, punctuation, or partial words should normalize consistently and never create duplicate result entries.
- An unknown page slug must render a real 404 state rather than leaking implementation details or crashing server rendering.
- External canonical links must be validated as HTTPS URLs before rendering; malformed seed data must fail validation during build/test rather than becoming clickable unsafe links.
- Mobile widths down to 320px must keep the search box, filters, result cards, and page CTAs usable without horizontal overflow.

---

### Task 1: Bootstrap the Standalone Hynoe Search Application

**Files:**
- Create in the new standalone repository `HynoeGeshi/hynoe-search`: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/not-found.tsx`
- Create: `tests/smoke/home.test.tsx`
- Create: `e2e/home.spec.ts`

**Interfaces:**
- Consumes: none.
- Produces: a standalone Next.js application with `npm test`, `npm run build`, and `npm run test:e2e` commands; shared root layout and global design tokens.

- [ ] **Step 1: Write the failing smoke test**
  - Assert the root page renders the `HYNOE` brand, a search input with accessible name `Search Hynoe`, and a submit action.
- [ ] **Step 2: Run the smoke test and verify it fails**
  - Run: `npm test -- tests/smoke/home.test.tsx`
  - Expected: FAIL because the application shell does not exist yet.
- [ ] **Step 3: Scaffold the minimal standalone Next.js/TypeScript app**
  - Use App Router and TypeScript.
  - Add scripts: `dev`, `build`, `start`, `test`, `test:watch`, `test:e2e`.
  - Do not copy runtime secrets, server credentials, or code from Hynoe SMP.
- [ ] **Step 4: Implement the root layout and minimal homepage shell**
  - Root metadata title: `Hynoe Search`.
  - Root description should describe discovery for independent businesses, creators, services, communities, games, and projects.
- [ ] **Step 5: Run unit and build verification**
  - Run: `npm test -- tests/smoke/home.test.tsx && npm run build`
  - Expected: PASS and successful production build.
- [ ] **Step 6: Add browser smoke coverage**
  - Assert `/` loads at a 320px viewport with no horizontal document overflow and the search field remains visible.
- [ ] **Step 7: Run the browser smoke test**
  - Run: `npm run test:e2e -- e2e/home.spec.ts`
  - Expected: PASS.
- [ ] **Step 8: Commit**
  - Commit message: `feat: bootstrap Hynoe Search app`.

### Task 2: Define the Safe Hynoe Page Data Contract and Flagship Seed Records

**Files:**
- Create: `src/domain/pages/types.ts`
- Create: `src/domain/pages/schema.ts`
- Create: `src/domain/pages/page-repository.ts`
- Create: `src/data/flagship-pages.ts`
- Create: `src/data/page-repository.memory.ts`
- Create: `tests/domain/page-schema.test.ts`
- Create: `tests/data/flagship-pages.test.ts`

**Interfaces:**
- Consumes: standalone application from Task 1.
- Produces:
  - `type HynoePage`
  - `type HynoePageType = "local_business" | "service_provider" | "creator" | "community" | "digital_product" | "project_brand"`
  - `interface PageRepository { list(): Promise<HynoePage[]>; getBySlug(slug: string): Promise<HynoePage | null> }`
  - `createMemoryPageRepository(pages: readonly HynoePage[]): PageRepository`

- [ ] **Step 1: Write failing schema tests**
  - Assert a valid page accepts safe typed modules only.
  - Assert malformed `http:` or invalid canonical URLs are rejected.
  - Assert unknown module types are rejected.
  - Assert duplicate slugs are rejected by flagship data validation.
- [ ] **Step 2: Run the tests and verify failure**
  - Run: `npm test -- tests/domain/page-schema.test.ts tests/data/flagship-pages.test.ts`
  - Expected: FAIL because contracts and seed data do not exist.
- [ ] **Step 3: Implement the typed page model and runtime validation**
  - Base page fields: `id`, `slug`, `name`, `pageType`, `summary`, `description`, `categories`, `tags`, `status`, `featured`, `canonicalUrl`, `location`, `modules`.
  - Module union supports only validated first-party structures such as `hero`, `links`, `services`, `portfolio`, `features`, `updates`, `community`, `media`, and `cta`.
- [ ] **Step 4: Add the three initial flagship records**
  - `hynoe-outpost`: digital product/game; canonical platform route is Hynoe-owned and launch CTA targets the Outpost experience.
  - `hynoe-smp`: community; canonical external site is `https://hynoesmp.com`.
  - `hynoe-flicks`: service provider/creator; canonical external site is `https://hynoeflicks.com`.
  - Do not invent fake reviews, fake real-time status, fake availability, or unsupported claims.
- [ ] **Step 5: Implement the memory repository**
  - Repository must return immutable page values and `null` for unknown slugs.
- [ ] **Step 6: Run tests**
  - Run: `npm test -- tests/domain/page-schema.test.ts tests/data/flagship-pages.test.ts`
  - Expected: PASS.
- [ ] **Step 7: Commit**
  - Commit message: `feat: add Hynoe Page data model and flagship records`.

### Task 3: Build Deterministic Search Normalization and Ranking

**Files:**
- Create: `src/domain/search/types.ts`
- Create: `src/domain/search/normalize-query.ts`
- Create: `src/domain/search/search-pages.ts`
- Create: `tests/domain/search.test.ts`

**Interfaces:**
- Consumes: `HynoePage` and `PageRepository` from Task 2.
- Produces:
  - `normalizeQuery(input: string): string`
  - `searchPages(pages: readonly HynoePage[], query: string, filters?: SearchFilters): SearchResult[]`
  - `type SearchFilters = { pageType?: HynoePageType; category?: string }`
  - `type SearchResult = { page: HynoePage; score: number; matchedFields: string[] }`

- [ ] **Step 1: Write failing ranking tests**
  - Exact name match outranks tag-only match.
  - Category match boosts a page without overriding a stronger exact query match.
  - Mixed case and punctuation normalize to the same query.
  - Empty/whitespace/punctuation-only query returns featured/discovery pages in deterministic order rather than throwing.
  - Partial word matching finds `photography` from `photo` and `Minecraft` from `mine` only when the normalized token threshold is met.
  - A page appears at most once in output.
- [ ] **Step 2: Run tests and verify failure**
  - Run: `npm test -- tests/domain/search.test.ts`
  - Expected: FAIL because search does not exist.
- [ ] **Step 3: Implement normalization**
  - Lowercase, Unicode-normalize, trim, collapse whitespace, strip non-useful punctuation, and preserve safe alphanumeric word boundaries.
- [ ] **Step 4: Implement weighted Phase 1 ranking**
  - Highest weight: exact/near-exact page name.
  - Then categories and primary tags.
  - Then summary/description/module text.
  - Featured status is used only as a discovery tie-break for blank queries, not as a paid organic-rank override.
  - Stable tie-breaker: page name ascending.
- [ ] **Step 5: Run tests**
  - Run: `npm test -- tests/domain/search.test.ts`
  - Expected: PASS.
- [ ] **Step 6: Commit**
  - Commit message: `feat: add Hynoe Search ranking engine`.

### Task 4: Build the Search Homepage and Results Experience

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/search/page.tsx`
- Create: `src/components/search/search-form.tsx`
- Create: `src/components/search/result-card.tsx`
- Create: `src/components/search/filter-bar.tsx`
- Create: `tests/ui/search-page.test.tsx`
- Create: `e2e/search.spec.ts`

**Interfaces:**
- Consumes: `PageRepository`, `searchPages`, `SearchFilters`.
- Produces: public routes `/` and `/search?q=<query>` with typed filter query parameters.

- [ ] **Step 1: Write failing UI tests**
  - Homepage renders one dominant search field and compact category shortcuts.
  - Search form submits to `/search` using `q`.
  - Search results show name, type/category, summary, and destination CTA.
  - Blank query displays discovery results rather than `No results`.
  - No-result query displays a useful empty state with a clear new-search action.
- [ ] **Step 2: Run tests and verify failure**
  - Run: `npm test -- tests/ui/search-page.test.tsx`
  - Expected: FAIL.
- [ ] **Step 3: Implement the homepage hierarchy**
  - Above fold: HYNOE mark, one dominant search box, concise value proposition, compact shortcuts.
  - Below fold: `Hynoe Originals` showcasing Outpost, SMP, and Flicks as intentionally different examples.
- [ ] **Step 4: Implement the search results route**
  - Parse `q`, `type`, and `category` safely.
  - Unknown filter values are ignored rather than causing an error.
  - Result card external canonical links use safe link attributes; hosted pages use internal routes.
- [ ] **Step 5: Add responsive styles**
  - Verify 320px through desktop; no horizontal page overflow.
- [ ] **Step 6: Run unit tests**
  - Run: `npm test -- tests/ui/search-page.test.tsx`
  - Expected: PASS.
- [ ] **Step 7: Add browser search scenarios**
  - Search `Minecraft` and assert Hynoe SMP is first or clearly top-ranked.
  - Search `photographer` and assert Hynoe Flicks appears.
  - Search `browser game` and assert Hynoe Outpost appears.
  - Exercise blank query and no-result query at 320px and desktop widths.
- [ ] **Step 8: Run browser tests**
  - Run: `npm run test:e2e -- e2e/search.spec.ts`
  - Expected: PASS with no console errors.
- [ ] **Step 9: Commit**
  - Commit message: `feat: build Hynoe search and discovery UI`.

### Task 5: Build the Reusable Hynoe Page Renderer

**Files:**
- Create: `src/app/p/[slug]/page.tsx`
- Create: `src/components/page/page-shell.tsx`
- Create: `src/components/page/module-renderer.tsx`
- Create: `src/components/page/modules/hero-module.tsx`
- Create: `src/components/page/modules/links-module.tsx`
- Create: `src/components/page/modules/features-module.tsx`
- Create: `src/components/page/modules/services-module.tsx`
- Create: `src/components/page/modules/portfolio-module.tsx`
- Create: `src/components/page/modules/updates-module.tsx`
- Create: `src/components/page/modules/community-module.tsx`
- Create: `src/components/page/modules/media-module.tsx`
- Create: `src/components/page/modules/cta-module.tsx`
- Create: `tests/ui/page-renderer.test.tsx`
- Create: `e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `PageRepository.getBySlug()` and the safe module union.
- Produces: `hynoe.net/p/<slug>` renderer for all Phase 1 page types.

- [ ] **Step 1: Write failing page-renderer tests**
  - Each safe module type renders its accessible heading/content.
  - Unknown slug invokes the 404 path.
  - External canonical site link for SMP remains `https://hynoesmp.com`.
  - External canonical site link for Flicks remains `https://hynoeflicks.com`.
  - The renderer has no raw HTML or arbitrary script injection surface.
- [ ] **Step 2: Run tests and verify failure**
  - Run: `npm test -- tests/ui/page-renderer.test.tsx`
  - Expected: FAIL.
- [ ] **Step 3: Implement the page shell and module renderer**
  - Module renderer uses an exhaustive typed switch; unsupported runtime input fails validation before render.
- [ ] **Step 4: Implement flagship-specific compositions through data only**
  - Do not fork three unrelated page templates unless a first-party module genuinely requires it.
  - Outpost CTA emphasizes Play.
  - SMP CTA emphasizes Visit/Join through its independent website.
  - Flicks CTA emphasizes portfolio/services through its independent website.
- [ ] **Step 5: Run unit tests**
  - Run: `npm test -- tests/ui/page-renderer.test.tsx`
  - Expected: PASS.
- [ ] **Step 6: Add browser coverage**
  - Visit all three pages at 320px and desktop width.
  - Assert no horizontal overflow, no console errors, and correct canonical destination links.
  - Visit `/p/does-not-exist` and assert 404.
- [ ] **Step 7: Run browser tests**
  - Run: `npm run test:e2e -- e2e/pages.spec.ts`
  - Expected: PASS.
- [ ] **Step 8: Commit**
  - Commit message: `feat: add reusable Hynoe Page renderer`.

### Task 6: Add SEO, Indexing, and Discovery Metadata

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/p/[slug]/page.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/manifest.ts`
- Create: `src/lib/seo/page-metadata.ts`
- Create: `tests/seo/metadata.test.ts`

**Interfaces:**
- Consumes: public page records.
- Produces: `buildPageMetadata(page: HynoePage): Metadata`, sitemap and robots metadata routes.

- [ ] **Step 1: Write failing SEO tests**
  - Every public flagship page has a unique title and description.
  - SMP canonical metadata references the Hynoe Search page URL while prominently exposing its independent external site as the destination; it does not claim Hynoe Search replaced `hynoesmp.com`.
  - Flicks follows the same separation rule for `hynoeflicks.com`.
  - Sitemap contains `/`, `/search`, and each public `/p/<slug>` route.
  - Robots allows public discovery routes and does not advertise future account/admin routes.
- [ ] **Step 2: Run tests and verify failure**
  - Run: `npm test -- tests/seo/metadata.test.ts`
  - Expected: FAIL.
- [ ] **Step 3: Implement metadata, sitemap, robots, and manifest**
  - Use `https://hynoe.net` as canonical base for Hynoe Search routes.
- [ ] **Step 4: Run tests and build**
  - Run: `npm test -- tests/seo/metadata.test.ts && npm run build`
  - Expected: PASS.
- [ ] **Step 5: Commit**
  - Commit message: `feat: add Hynoe Search SEO metadata`.

### Task 7: Add the Hynoe Outpost Direct-Domain Entry Contract

**Files:**
- Create: `src/middleware.ts` or the current supported Next.js equivalent verified at implementation time.
- Create: `src/lib/host-routing.ts`
- Create: `tests/routing/host-routing.test.ts`
- Create: `e2e/outpost-host.spec.ts`
- Modify the existing Hynoe Outpost site only if a minimal safe redirect/entry adapter is required; do not alter `hynoesmp.com` canonical ownership.

**Interfaces:**
- Consumes: request host and pathname.
- Produces: `resolveHostRoute(host: string, pathname: string): HostRouteDecision` mapping `outpost.hynoe.net` into the Outpost entry experience without changing SMP/Flicks canonical sites.

- [ ] **Step 1: Verify the current Next.js host-routing mechanism in official documentation before coding**
  - Do not assume middleware/proxy naming from stale framework knowledge.
- [ ] **Step 2: Write failing routing tests**
  - `outpost.hynoe.net/` resolves to the Outpost entry route.
  - `hynoe.net/` remains the Search homepage.
  - `hynoesmp.com` is not proxied through Hynoe Search.
  - `hynoeflicks.com` is not proxied through Hynoe Search.
  - Unknown hosts fall back safely rather than impersonating a first-party hostname.
- [ ] **Step 3: Run tests and verify failure**
  - Run: `npm test -- tests/routing/host-routing.test.ts`
  - Expected: FAIL.
- [ ] **Step 4: Implement host routing using the framework-supported mechanism**
  - Keep the resolver pure and independently testable.
- [ ] **Step 5: Run routing tests**
  - Run: `npm test -- tests/routing/host-routing.test.ts`
  - Expected: PASS.
- [ ] **Step 6: Add browser/preview verification for host routing**
  - Use preview host mapping or request-host injection in test infrastructure before DNS changes.
- [ ] **Step 7: Commit**
  - Commit message: `feat: add Outpost vanity host routing`.

### Task 8: Production Verification and Deployment Gate

**Files:**
- Create: `.github/workflows/verify.yml`
- Create: `docs/release/phase-1-checklist.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: CI verification gate and deployment checklist.

- [ ] **Step 1: Add CI checks**
  - Run type checking, unit tests, production build, and Playwright smoke tests.
- [ ] **Step 2: Add a release checklist**
  - Verify `hynoe.net` homepage.
  - Verify all three flagship pages.
  - Verify SMP outbound destination remains `hynoesmp.com`.
  - Verify Flicks outbound destination remains `hynoeflicks.com`.
  - Verify Outpost host behavior before and after DNS assignment.
  - Verify 320px mobile width and desktop width.
  - Verify no public runtime secrets or unrelated Hynoe credentials are present.
- [ ] **Step 3: Run the full local/CI-equivalent suite**
  - Run: `npm test && npm run build && npm run test:e2e`
  - Expected: all checks PASS.
- [ ] **Step 4: Deploy as a separate Vercel project**
  - Do not reuse the Hynoe SMP deployment project.
  - Attach `hynoe.net` only after preview verification passes.
  - Attach `outpost.hynoe.net` after host-routing preview verification passes.
- [ ] **Step 5: Verify production**
  - Check `/`, `/search`, each flagship `/p/<slug>`, unknown-page 404, and the Outpost host.
  - Confirm no console errors on mobile or desktop.
- [ ] **Step 6: Commit release documentation**
  - Commit message: `chore: add Hynoe Search production verification gate`.

## Deferred to Separate Plans

The following are intentionally **not** folded into Phase 1 because each is an independently risky subsystem and should have its own design/implementation review:

1. **Accounts + page ownership + Supabase** — create a dedicated Hynoe Search Supabase project, Auth, RLS, page/team ownership, safe media storage, and page editor.
2. **Third-party page creation** — onboarding, customization controls, validation, moderation, claim flows, and page publishing lifecycle.
3. **Reviews + two-score reputation** — Customer Rating, Hynoe Trust Score, review eligibility, abuse detection, reporting, owner responses, and moderation audit trail.
4. **Location search** — city/ZIP/coarse permissioned browser location, distance ranking, hidden residential addresses, and service areas.
5. **Advanced indexing** — Postgres FTS/trigram search behind the same search interfaces, analytics, freshness signals, and eventual dedicated search infrastructure only if production data requires it.
6. **Monetization** — premium themes/subdomains/analytics, sponsored-result separation, billing, entitlements, and transaction handling if later added.

## Plan Self-Review Result

- Spec coverage: Phase 1 covers the public platform shell, safe Hynoe Pages, flagship dogfooding, search/ranking foundation, domain separation, Outpost vanity host, SEO, responsive behavior, and security isolation. Stateful/user-generated subsystems are explicitly decomposed into later plans.
- Step scan: Each task has a failing-test → implementation → verification → commit cycle; no implementation bodies are prescribed where signatures/tests are sufficient.
- Type consistency: `HynoePage`, `PageRepository`, `SearchFilters`, and `SearchResult` are defined once and consumed by later tasks.
- Review Focus: all five listed failure modes are assigned to page schema, search, page renderer, or browser tests.
- Proportion: implementation details are limited to interfaces, pinned behaviors, and validation requirements rather than full source code.
