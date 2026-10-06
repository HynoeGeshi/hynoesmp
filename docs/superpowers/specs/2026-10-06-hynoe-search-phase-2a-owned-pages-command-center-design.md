# Hynoe Search Phase 2A — Owned Pages & Command Center Design

## Status
Approved in chat on 2026-10-06.

## Purpose
Phase 2A turns Hynoe Search from a public discovery shell into the first real Hynoe platform loop: users can own a Hynoe Page, manage it from a private Command Center, receive inquiries, measure discovery, and improve their page with actionable recommendations.

This phase implements the reusable platform core that Hynoe CreatorOps will use first. It does not yet implement public reviews, Trust Score, sponsored placement, direct marketplace transactions, or complex billing tiers.

## Product Flow
1. A user signs into a Hynoe account.
2. The user creates or claims a Hynoe Page.
3. The user manages that page from the Command Center.
4. The public page becomes searchable when published.
5. Visitors discover the page through Hynoe Search.
6. Visitors can submit an inquiry to the page owner.
7. Owners see page health, discovery activity, and inquiry performance.
8. Hynoe recommends actions that improve completeness and discovery.
9. CreatorOps operators can be added as authorized page members without sharing account credentials.

## Scope

### Accounts
Use a dedicated Hynoe Search Supabase project for Auth, database, and future storage.

Initial sign-in should be email-first/passwordless. Social login is deferred.

Authentication and authorization are separate: authentication proves who the user is; page membership determines what that user may manage.

### Page Ownership
Introduce reusable ownership primitives:
- `profiles`
- `pages`
- `page_members`

Page members support roles that can later map to owner, manager, editor, or CreatorOps operator. Phase 2A should implement only the minimum roles needed for ownership and editing while keeping the schema extensible.

Authorization must come from server-validated page membership records. Do not use user-editable metadata for authorization decisions.

### Editable Hynoe Pages
Owners can manage validated structured fields and modules:
- page name
- summary / description
- page type
- categories
- tags
- location / service area where applicable
- canonical external URL
- social / contact links
- service cards
- portfolio / content cards
- primary CTA
- secondary CTA
- draft / published status

No arbitrary JavaScript, raw HTML, or unrestricted CSS may be stored or rendered.

Published page routes remain `hynoe.net/p/<slug>`.

Independent canonical properties such as `https://hynoesmp.com` and `https://hynoeflicks.com` remain independent; their Hynoe Pages act as discovery and conversion profiles.

### Command Center
Create a private owner dashboard that is deliberately reusable across creators, local businesses, service providers, and projects.

Initial sections:
- Overview
- My Page
- Inquiries
- Search Visibility
- Activity
- Settings

Overview should surface:
- page publication state
- page health/completeness
- recent page views
- search-result clicks
- inquiry count
- top query/category signals when enough data exists
- prioritized recommended actions

My Page should edit the safe structured page schema and show a public-preview path.

Search Visibility should explain discoverability in understandable terms rather than exposing an opaque ranking score. Recommendations can include actions such as adding services, adding portfolio work, completing service area, connecting the canonical website, improving page summary, or publishing the page.

### Inquiry / Lead Capture
Public pages can expose a Hynoe inquiry form.

The initial inquiry schema should capture only what is needed to contact and qualify the lead, such as:
- page
- sender name
- sender email
- message
- optional request type
- created timestamp
- owner-visible status

Owners may only read inquiries for pages they are authorized to manage.

Resend should send transactional owner notifications without exposing private service credentials to the browser.

Spam protection and rate limiting are required before public launch.

### Product Analytics
PostHog should be added from the start for product behavior, not as a later retrofit.

Initial events:
- search_submitted
- search_result_clicked
- page_viewed
- page_claim_started
- page_created
- page_editor_opened
- page_updated
- page_published
- inquiry_started
- inquiry_submitted
- recommendation_clicked

Avoid collecting unnecessary personal data in analytics properties.

### Stripe Foundation
Stripe is a foundation in this phase, not a ranking lever.

Create only the minimum platform concepts needed so a Hynoe account/page can later be associated with subscription/customer state. Do not gate organic rank, public page creation, or basic discovery behind payment in Phase 2A.

Paid products will be designed separately.

## Data Model Direction

### profiles
Maps authenticated users to Hynoe product profile data.

Minimum fields:
- `id uuid primary key` matching `auth.users.id`
- display name
- avatar URL where supported
- created / updated timestamps

### pages
Persistent Hynoe Page record.

Minimum fields:
- id
- slug
- page type
- name
- summary
- description
- canonical URL
- publication state
- location/service-area fields sufficient for Phase 2A
- created / updated timestamps

Structured modules should remain validated data, not arbitrary markup.

### page_members
Membership and authorization mapping.

Minimum fields:
- page id
- user id
- role
- created timestamp

The owner cannot accidentally orphan a page through an ordinary edit flow.

### inquiries
Minimum fields:
- id
- page id
- sender name
- sender email
- message
- request type nullable
- status
- created timestamp

Public users may create inquiries only through a constrained server path. Browsers do not receive unrestricted table-write privileges.

### analytics
Detailed product analytics stays in PostHog. The Hynoe database should store only product state or aggregates needed by the UI, not duplicate the entire PostHog event stream.

## Security
- Dedicated Hynoe Search Supabase project. Never reuse the YouTube-agent project.
- RLS enabled on every exposed user-owned table.
- Page membership is the authorization source of truth.
- Never authorize from `user_metadata`.
- Never expose Supabase service-role / secret keys in public code.
- Frontend receives only publishable client credentials.
- UPDATE RLS policies use both `USING` and `WITH CHECK` and have corresponding SELECT access.
- Public inquiry submission goes through validation, rate limiting, and anti-spam controls.
- Views exposed through the Data API use `security_invoker` where supported or remain unavailable to public roles.
- Secrets for Resend, Stripe, and privileged Supabase actions remain server-only on Render.
- Hynoe Page content stays within a validated module schema; no arbitrary executable content.

## Deployment
Hynoe Search remains deployed through Render.

Render hosts the Next.js application and server-side integrations. The current `hynoe-search` Render service remains the app deployment target.

Supabase provides Auth/database/storage as needed. Stripe, PostHog, and Resend remain external product services.

## CreatorOps Integration
CreatorOps is the first operating customer of the same primitives.

A CreatorOps operator can be added as an authorized page member rather than receiving a creator's password.

Repeated CreatorOps workflows should map into the Command Center over time:
- audits -> page/search health
- content performance -> connected analytics
- websites -> Hynoe Page editor
- lead handling -> inquiries
- sponsorship preparation -> future sponsor/media-kit module
- publishing workflows -> future content calendar
- SEO -> Search Visibility

The platform must not fork into a separate CreatorOps-only architecture. CreatorOps should prove the reusable Hynoe platform model.

## Explicitly Deferred
- public reviews
- Hynoe Trust Score calculation
- paid/sponsored search placement
- marketplace checkout / escrow
- complex Stripe plans
- social OAuth/login
- direct social publishing
- AI agent autonomy
- creator sponsorship marketplace
- advanced location ranking
- public custom themes beyond the safe page module system

## Success Criteria
Phase 2A is successful when:
1. A new user can authenticate securely.
2. An authenticated user can create or own a Hynoe Page.
3. Only authorized members can edit that page.
4. A page can move between draft and published states.
5. Published pages are discoverable through Hynoe Search without changing the canonical-domain rules for SMP/Flicks.
6. A public visitor can submit an inquiry safely.
7. Only authorized page members can view/manage that inquiry.
8. Transactional inquiry notification can be delivered through Resend.
9. PostHog records the core search/page/editor/inquiry funnel without unnecessary PII.
10. The Command Center shows useful page health and discovery recommendations.
11. Stripe customer/subscription linkage can be added later without redesigning account/page ownership.
12. Existing Phase 1 public search routes continue to work.
