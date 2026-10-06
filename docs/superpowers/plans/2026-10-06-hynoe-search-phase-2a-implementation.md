# Hynoe Search Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with TDD and verification gates.

**Goal:** Add secure Hynoe accounts, owned/editable Hynoe Pages, a private Command Center, safe inquiry capture, and the integration foundations for PostHog, Resend, and Stripe without changing organic search ranking.

**Architecture:** Extend the existing `hynoe-search-app/` Next.js app with Supabase SSR auth and a dedicated Hynoe Search database. Authorization is page-membership based; public Page content remains validated structured data. Private Command Center routes are dynamic and server-validated. Inquiry submission goes through a constrained server route with validation and rate limiting. The existing public search/retention system remains intact.

**Tech Stack:** Next.js 16.3.8, React 19.2.0, TypeScript 5.9.3, Supabase JS 2.117.1, `@supabase/ssr` 0.12.7, PostHog, Render, Resend, Stripe.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-search-phase-2a-owned-pages-command-center-design.md`

## Global Constraints

- Use a dedicated Hynoe Search Supabase project; never reuse the YouTube-agent or SMP database.
- RLS on every exposed user-owned table.
- Authorization derives from `page_members`, never `user_metadata`.
- Never expose service-role or other privileged secrets to browser code.
- Authenticated routes must not use ISR or shared caching.
- Public inquiry creation uses server validation, rate limiting, and anti-spam controls.
- No arbitrary user JavaScript, HTML, or unrestricted CSS.
- Existing Hynoe Search public routes and canonical SMP/Flicks destinations remain functional.
- Stripe state does not affect organic rank.
- Social login, reviews, Trust Score, sponsored placement, marketplace checkout, and autonomous AI actions remain deferred.

## Task 1 — Supabase Contract + Secure Data Model
- Add pinned Supabase dependencies and Node runtime floor.
- Add `supabase/migrations/` SQL for `profiles`, `pages`, `page_members`, `inquiries` and helper indexes/constraints.
- Enable RLS and create owner/editor/member policies using `auth.uid()` ownership predicates with both `USING` and `WITH CHECK` for updates.
- Keep public inquiry table inserts unavailable directly to browsers.
- Add schema/security tests that statically verify RLS/policy requirements.

## Task 2 — SSR Auth Foundation
- Add browser/server Supabase client factories using publishable credentials only.
- Add middleware/session refresh path compatible with Next.js App Router.
- Add email-first sign-in/sign-out routes and auth callback handling.
- Add `requireUser()` server helper and tests.

## Task 3 — Owned Page Repository + Editor
- Add server repository functions for authorized page read/create/update/publish operations.
- Add validated editor payload schema; reject arbitrary markup/scripts and invalid HTTPS destinations.
- Add `/command-center/page` editor and preview link.
- Preserve existing public Hynoe Page rendering contract.

## Task 4 — Command Center Overview + Recommendations
- Add dynamic authenticated `/command-center` shell.
- Add Overview, My Page, Inquiries, Search Visibility, Activity, Settings navigation.
- Add explainable Page Health and prioritized recommendation engine.
- Add tests for no-page, draft, published, incomplete and healthy states.

## Task 5 — Safe Inquiry Capture
- Add public inquiry form server route with strict field limits, email validation, honeypot and IP/request throttling abstraction.
- Persist only through server-side privileged path after validation.
- Add owner-only inquiry list/status update surface.
- Add Resend adapter with no-op behavior until server secret exists.

## Task 6 — Analytics + Stripe Foundations
- Extend PostHog event union for signup, editor, publish, inquiry and recommendation events without sensitive freeform properties.
- Add database fields/tables necessary to link a Hynoe account/page to future Stripe customer/subscription state without gating free discovery.
- Add Stripe adapter interfaces only; no paid products or checkout yet.

## Task 7 — Environment + Deployment Verification
- Document required Render environment variables and which are public vs server-only.
- Run unit/domain/build/e2e gates in GitHub Actions.
- Run Supabase security/performance advisors after the dedicated project exists and schema is applied.
- Verify public search routes plus auth/Command Center behavior before promoting the branch to Render.
