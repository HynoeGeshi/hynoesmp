# Hynoe Search Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Follow TDD for every behavior change.

**Goal:** Add secure Hynoe accounts, owned Pages, the first private Command Center, and safe inquiry capture without changing organic ranking or the public canonical-domain rules.

**Architecture:** Keep the public Hynoe Search app in `hynoe-search-app/` on Render. Add a dedicated Supabase-backed persistence/auth layer behind small adapters, with cookie-based SSR auth for Next.js, server-validated page membership for authorization, RLS on exposed tables, and server-only secrets for privileged actions. Public discovery remains usable without sign-in.

**Tech Stack:** Next.js 16.3.8, React 19.2.0, TypeScript 5.9.3, Supabase Auth/Postgres/RLS, `@supabase/supabase-js`, `@supabase/ssr`, Render, PostHog, Resend.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-search-phase-2a-owned-pages-command-center-design.md`

## Global Constraints
- Dedicated Hynoe Search Supabase project; never reuse the YouTube-agent database.
- `hynoesmp.com` and `hynoeflicks.com` remain independent canonical destinations.
- Public search does not require an account.
- Authorization source of truth is `page_members`, never user-editable metadata.
- RLS enabled on every exposed user-owned table.
- `service_role`/secret keys never reach the browser.
- Authenticated routes are dynamic and must not be ISR-cached.
- Public inquiry creation goes through a constrained server route with validation/rate limiting.
- No reviews, Trust Score, sponsored ranking, marketplace checkout, or complex billing in this phase.

## Task 1 — Supabase environment and SSR client boundary
- Add pinned `@supabase/supabase-js` and `@supabase/ssr`.
- Add typed env validation for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Add browser/server Supabase client factories and auth proxy/session-refresh boundary.
- Tests: missing env fails safely in server-only setup; public pages do not instantiate privileged clients.

## Task 2 — Schema, RLS, and ownership model
- Add migration for `profiles`, `pages`, `page_members`, `inquiries`.
- Add publication state, safe structured content fields, timestamps, role constraint, ownership-safe indexes.
- Enable RLS and policies for member read/update; public published-page read only; inquiry reads restricted to authorized page members.
- No direct anonymous table insert for inquiries.
- Add SQL policy regression tests/documented verification queries.

## Task 3 — Email-first auth flow
- Add sign-in page and email magic-link/OTP request action.
- Add auth callback/session handling and sign-out.
- Add `requireUser()` server helper using verified Supabase user identity.
- Keep neutral public search available without sign-in.

## Task 4 — Protected Command Center shell
- Add `/command-center` with Overview, My Page, Inquiries, Search Visibility, Activity, Settings.
- Use page membership query to select only pages the user may manage.
- Add empty onboarding state for users with no owned page.
- Force dynamic rendering on authenticated routes.

## Task 5 — Owned Page creation/edit/publish
- Add safe server actions for create/update/publish against validated fields only.
- Prevent arbitrary HTML/JS/CSS storage.
- Preserve canonical external URLs for SMP/Flicks.
- Add page-health calculation and explainable recommendations.

## Task 6 — Public inquiry capture
- Add validated public inquiry route/form.
- Server-side rate limiting + honeypot/anti-spam primitive.
- Store inquiry via privileged server path only.
- Owner inbox can update inquiry status for authorized pages only.

## Task 7 — Notifications and analytics
- Send inquiry-received email through Resend from server only.
- Extend PostHog events for signup, editor, publish, inquiry, recommendation actions without unnecessary PII.

## Task 8 — Security verification and Render release
- Run unit, domain, E2E, build, Supabase advisors, and RLS verification.
- Verify public routes remain anonymous and canonical links unchanged.
- Verify authenticated routes reject unauthenticated access.
- Release to Render only after green CI and production smoke checks.
