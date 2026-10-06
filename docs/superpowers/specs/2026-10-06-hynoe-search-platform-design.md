# Hynoe Search Platform — Architecture & Product Design

Date: 2026-10-06
Status: Proposed for owner review
Design branch: `hynoe-search-architecture-2026-10-06`

## 1. Product definition

HYNOE becomes the umbrella discovery platform and master brand, not merely a contractor directory.

The public product is **Hynoe Search**: a search-and-discovery system for independent businesses, creators, contractors, communities, games, projects, and Hynoe-owned properties. Search results lead to structured, highly customizable **Hynoe Pages** rather than plain outbound links.

The platform should feel like a blend of:

- a modern search engine;
- a local/small-business directory;
- a creator profile network;
- a lightweight website builder;
- a discovery marketplace;
- a launch surface for Hynoe-owned products.

The purpose is to help smaller or independent operators become discoverable without requiring them to build and market a full standalone website first.

## 2. Brand architecture

Use this hierarchy:

- **HYNOE** — master company/platform brand.
- **Hynoe Search** — search, discovery, directory, and hosted-page product.
- **Hynoe Pages** — customizable hosted pages for people, businesses, projects, communities, and products.
- **Hynoe Outpost** — Hynoe-owned browser game and flagship interactive page.
- **Hynoe SMP** — Hynoe-owned Minecraft community/server and flagship community page.
- **Hynoe Flicks** — Hynoe-owned photography/service business and flagship professional-services page.

The three Hynoe-owned properties provide intentionally different examples of what Hynoe Search can host:

1. Hynoe Outpost demonstrates an interactive digital product/game.
2. Hynoe SMP demonstrates a community/service with live status, updates, media, and joining instructions.
3. Hynoe Flicks demonstrates a local creative business with portfolio, service packages, availability, reviews, and booking actions.

## 3. Domain strategy

### Primary recommendation

Use **hynoe.net** as the master domain now.

Do not delay Hynoe Search waiting for `hynoe.com`. Current registration checks show `hynoe.com` unavailable while `hynoe.net` is viable as the platform identity. If `hynoe.com` later becomes reasonably obtainable, acquire it and redirect it to the canonical `.net` domain rather than migrating the platform again.

### Canonical routes

- `hynoe.net` — search homepage and platform home.
- `hynoe.net/search?q=...` — search results.
- `hynoe.net/p/<slug>` — standard Hynoe Page route.
- `hynoe.net/explore` — category and discovery feed.
- `hynoe.net/local` — location-focused discovery.
- `hynoe.net/account` — account/dashboard.
- `hynoe.net/create` — create/claim a page.

### Hynoe-owned vanity subdomains

- `outpost.hynoe.net` — direct entry to Hynoe Outpost.
- `smp.hynoe.net` — direct entry to Hynoe SMP.
- `flicks.hynoe.net` — direct entry to Hynoe Flicks.
- `search.hynoe.net` — optional redirect to `hynoe.net`, not a separate canonical product.

Existing standalone domains such as `hynoesmp.com` and `hynoeflicks.com` should remain usable and redirect or deep-link intelligently instead of being abruptly retired.

### Future vanity domains

Third-party users may eventually qualify for `<slug>.hynoe.net` as a premium or verified-page feature. Standard pages remain under `hynoe.net/p/<slug>` so wildcard routing does not become mandatory for launch.

## 4. Product principles

The platform must follow these rules:

1. **Independent-first.** Small operators should feel more discoverable, not buried under enterprise brands.
2. **Useful before social.** Pages must help people find, evaluate, contact, book, buy from, join, or use something.
3. **Customization without chaos.** Page owners can make pages visually distinct without breaking accessibility, security, mobile usability, or search indexing.
4. **Search quality cannot be bought.** Paid placement is clearly separated and labeled; core organic ranking is relevance/trust-based.
5. **Mobile-first.** Creating, searching, browsing, contacting, and managing pages must work comfortably from a phone.
6. **Security by isolation.** Hynoe Search must not share privileged runtime access, secrets, databases, or administrative credentials with Hynoe SMP, Hynoe Outpost, or unrelated automation systems.
7. **Structured data over scraped chaos.** The highest-quality search results come from owner-managed structured page data, with outside-web ingestion treated as a later supplement.

## 5. Search experience

### Homepage

The homepage should be extremely simple above the fold:

- HYNOE brand mark;
- one dominant search box;
- location awareness/selection;
- compact category shortcuts;
- a rotating or curated discovery surface below search.

Users should be able to type natural queries such as:

- `photographer near Chicago Heights`
- `mobile mechanic open today`
- `Minecraft server with progression`
- `graphic designer under $300`
- `browser games I can play now`
- `black-owned clothing brands near me`
- `contractor with good client reviews`

### Search result types

Results can include:

- businesses;
- independent contractors;
- creators;
- services;
- products;
- communities;
- events;
- games/apps;
- Hynoe-owned properties.

### Search filters

Initial filters:

- location / distance;
- category;
- open/available now;
- price or price range where relevant;
- verified status;
- customer rating;
- accepts bookings/inquiries;
- online vs local;
- newest / recently active;
- relevant service attributes by category.

Do not create dozens of global filters. Category-specific filters appear only when they make sense.

## 6. Ranking model

Organic search ranking should combine:

- text/query relevance;
- category match;
- location/distance relevance;
- profile completeness;
- verified ownership;
- recent activity;
- customer rating quality and volume;
- response/reliability signals where measurable;
- page freshness;
- spam/fraud risk;
- availability/status when relevant.

Avoid ranking solely by star average because a page with one 5-star rating should not automatically outrank a long-established page with many strong reviews.

### Sponsored placement

Sponsored/featured results may be monetized later, but must:

- be labeled clearly;
- occupy limited dedicated positions;
- never silently alter organic rank;
- still meet relevance and safety thresholds.

## 7. Two-score reputation system

Preserve the original requirement for two distinct trust signals, but make them understandable.

### 7.1 Customer Rating

A traditional customer/client review score based on completed interactions or verified review eligibility where possible.

Display:

- star/score average;
- review count;
- recent review trend;
- category-specific review dimensions where useful.

### 7.2 Hynoe Trust Score

A platform-generated reliability indicator, not another opinion rating.

Possible inputs:

- owner verified;
- profile completeness;
- age/history of page;
- response rate;
- completed bookings/interactions where supported;
- dispute/refund pattern;
- repeated spam reports;
- identity/business verification level;
- consistency between stated information and observed behavior;
- sustained recent activity.

The Trust Score must never imply a background check, criminal-record check, licensing guarantee, or legal certification unless Hynoe actually performs that verification and describes it accurately.

The scoring model must disclose the broad factors without exposing anti-abuse thresholds in enough detail to make gaming trivial.

## 8. Hynoe Pages

Every page is built from safe modules rather than arbitrary executable HTML/JavaScript.

### Base modules

- hero/banner;
- avatar/logo;
- bio/about;
- services;
- products/menu;
- portfolio/gallery;
- pricing;
- location/service area;
- hours/availability;
- booking/contact/inquiry;
- links/socials;
- reviews;
- updates/posts;
- media/video;
- FAQs;
- team members;
- credentials/licenses where applicable;
- achievements/badges;
- community links;
- live status/data module for approved integrations;
- embedded Hynoe experience module for first-party apps/games.

### Customization

Owners may customize:

- theme preset;
- accent palette within accessibility limits;
- background treatment;
- header layout;
- typography preset;
- module order;
- visible/hidden modules;
- cover media;
- music/audio only if later implemented with explicit user-controlled playback, never forced autoplay;
- optional custom domain/vanity subdomain in future tiers.

Do not allow arbitrary script injection, raw CSS that can escape its scope, remote inline JavaScript, or unsafe embeds.

This preserves the MySpace-style personal feeling without recreating MySpace-era security problems.

## 9. Page types

Page creation begins with a type because it determines modules, schema, filters, and calls-to-action.

Launch page types:

1. Local Business
2. Independent Contractor / Service Provider
3. Creator / Artist
4. Community / Organization
5. Digital Product / Game / App
6. General Project / Brand

Each type shares a common base identity but owns type-specific structured fields.

## 10. Hynoe flagship pages

### Hynoe Outpost

The Outpost page should act both as a searchable product page and the launch point into the game.

Suggested modules:

- original artwork/key art;
- play-now CTA;
- current game description;
- progression overview;
- Crew showcase;
- feature cards;
- updates/changelog;
- leaderboard preview;
- achievements;
- stream/video content;
- community links;
- device/browser support.

`outpost.hynoe.net` should resolve directly to the Outpost experience or a lightweight Outpost landing shell that launches the game immediately.

### Hynoe SMP

Suggested modules:

- server identity;
- live or recently refreshed status;
- join/install steps;
- pack download;
- server systems/progression;
- campaign information;
- latest updates;
- stream/video;
- Discord/community;
- Hynoe Outpost cross-link only where useful.

### Hynoe Flicks

Suggested modules:

- photography portfolio;
- service categories;
- package/pricing ranges;
- location/service area;
- availability/request booking;
- client reviews;
- social/Instagram links;
- before/after or featured shoots;
- contact/inquiry.

These three pages should be treated as production dogfooding: if Hynoe cannot represent its own three businesses/products cleanly, the general page system is not ready.

## 11. Accounts and ownership

Use one Hynoe identity system for Hynoe Search itself.

Account roles:

- visitor;
- page owner;
- page team member;
- reviewer/customer;
- moderator;
- platform admin.

A single user may own/manage multiple pages.

Authentication should use a managed provider such as Supabase Auth; Hynoe must not build a custom password system.

Page ownership verification should be separate from account existence. Verification levels may include:

- email verified;
- phone verified later if needed;
- domain ownership;
- business documentation where appropriate;
- platform/manual verification.

Do not make a verified badge mean more than the exact verification performed.

## 12. Reviews and abuse resistance

The review system must reduce fake-review incentives from launch.

Requirements:

- one account cannot spam unlimited reviews of the same page;
- owners cannot review their own pages;
- suspicious duplicate patterns are rate-limited or queued;
- page owners may respond publicly;
- users can report reviews;
- moderation state is explicit;
- review edits preserve audit metadata internally;
- verified-interaction reviews are visually distinguished from unverified-experience reviews if both are permitted;
- removing a negative review requires a rule violation, not merely owner disagreement.

## 13. Discovery beyond direct search

Hynoe should also have an `Explore` experience driven by:

- nearby pages;
- recently active pages;
- new verified pages;
- category collections;
- editorial/curated collections;
- trending interest with anti-manipulation limits;
- local/community spotlights;
- Hynoe Originals.

Personalization can come later. Initial discovery should not require invasive behavioral profiling.

## 14. Achievements and progression

The platform may use achievements to encourage owners to complete and maintain useful pages rather than gamifying meaningless activity.

Examples:

- Fully Set Up
- First Review
- 10 Client Reviews
- Quick Responder
- One Year on Hynoe
- Portfolio Complete
- Verified Domain
- Local Favorite
- Community Builder

Achievements must have transparent conditions and should not be purchasable directly.

## 15. Monetization model

Do not block basic usefulness behind payment.

Potential later revenue streams:

- premium page themes/layouts;
- vanity `<slug>.hynoe.net` subdomains;
- custom-domain support;
- enhanced analytics;
- booking/inquiry automation;
- verified business upgrades where real verification has a cost;
- clearly labeled sponsored discovery placements;
- premium media/storage limits;
- transaction or booking fees if Hynoe later processes commerce;
- Hynoe Outpost digital monetization as a separate product economy.

Organic search ranking must remain materially independent of subscription tier.

## 16. Technical architecture

Hynoe Search should be a separate deployable application and repository from Hynoe SMP.

Recommended initial stack:

- **Next.js / TypeScript** for the application;
- **Vercel** for frontend/server deployment and domain routing;
- **Supabase Postgres** for structured data;
- **Supabase Auth** for managed accounts;
- **Supabase Storage** for owner-uploaded media, with strict policies;
- PostgreSQL full-text/trigram-based search for the first production search layer;
- later dedicated search infrastructure only when scale/query quality actually requires it.

Do not prematurely add Elasticsearch/OpenSearch/Typesense/Meilisearch until production data proves PostgreSQL search is insufficient.

### Application boundaries

Suggested logical modules:

- identity/auth;
- page management;
- page renderer;
- search/query service;
- ranking service;
- location service;
- reviews/reputation;
- verification;
- media;
- moderation/reporting;
- analytics;
- billing/monetization later;
- first-party integration adapters.

Each module should expose a narrow interface rather than reading another module's tables arbitrarily.

## 17. Data model direction

Core entities:

- `profiles`
- `pages`
- `page_members`
- `page_modules`
- `page_categories`
- `categories`
- `page_locations`
- `services`
- `service_availability`
- `media_assets`
- `reviews`
- `review_responses`
- `verification_checks`
- `trust_signals`
- `achievements`
- `page_achievements`
- `reports`
- `moderation_actions`
- `search_events` with privacy-conscious retention
- `page_events` / analytics aggregates

Page modules should not be stored as unrestricted executable blobs. Use validated typed configuration per module.

## 18. Search indexing/data flow

1. Owner creates or updates a page.
2. Server validates ownership and input schema.
3. Canonical structured records are stored.
4. A normalized searchable document is generated from approved public fields.
5. Search index/document is updated.
6. Search queries retrieve candidates.
7. Ranking layer applies relevance, location, quality, trust, freshness, and safety signals.
8. Sponsored candidates are selected independently and labeled.
9. Result cards link to canonical Hynoe Pages.

Updates should become searchable quickly but need not be sub-second realtime at launch.

## 19. Location/privacy model

Search may use an entered city/ZIP or coarse browser location when the user explicitly permits it.

Do not require precise location for ordinary discovery.

For service providers, allow:

- exact public address;
- service-area-only location;
- city/region only;
- online-only.

Home-based businesses must be able to hide their residential street address while still appearing in geographically relevant results.

## 20. Security architecture

Hynoe Search must be isolated from Hynoe's other infrastructure.

Requirements:

- separate repository;
- separate deployment project;
- separate Supabase project/database from the existing YouTube automation project;
- separate secrets and API credentials;
- no Minecraft/Bloom/Discord admin credentials in the Hynoe Search runtime;
- no service-role Supabase key shipped to browser code;
- RLS on every exposed user-owned table;
- owner/team authorization enforced server-side and in RLS where applicable;
- private admin/moderation actions routed through protected server-side paths;
- strict upload MIME/size validation;
- image transformation/safe serving rather than trusting uploaded HTML/SVG/script content blindly;
- rate limits for account creation, reviews, reports, contact forms, and search abuse;
- CSRF protection where session architecture requires it;
- XSS-safe rendering;
- parameterized database access;
- Content Security Policy;
- tight CORS;
- verified webhook signatures;
- audit logging for privileged moderation/admin actions;
- no secrets in GitHub, browser bundles, screenshots, logs, or analytics;
- security-advisor checks after database changes;
- dependency pinning/lockfiles;
- automated secret scanning/security tests.

Hynoe-owned integrations should consume public or narrowly scoped APIs rather than share databases directly.

## 21. Moderation and platform safety

The system must support:

- report page;
- report review;
- impersonation report;
- prohibited-content report;
- fraud/scam report;
- temporary page restriction;
- search de-indexing without necessarily deleting owner data;
- owner appeal workflow;
- moderator notes/audit trail.

Do not launch open public page creation without basic abuse handling.

## 22. SEO and external discoverability

A Hynoe Page should also rank on conventional search engines where appropriate.

Requirements:

- clean canonical URLs;
- unique titles/descriptions;
- canonical tags;
- OpenGraph/social metadata;
- structured data/schema.org according to actual page type;
- XML sitemap generation;
- robots controls;
- image alt text;
- heading hierarchy;
- fast mobile rendering;
- accessible links;
- public `llms.txt`/AI-discovery strategy where useful;
- no indexing of private/draft pages.

Page owners should benefit from Hynoe's domain authority without being able to inject arbitrary SEO spam.

## 23. Analytics

Page owners should eventually see useful, privacy-conscious analytics:

- page views;
- search impressions;
- search clicks;
- inquiries/bookings;
- external-link clicks;
- top search terms in aggregated form;
- geographic summary at coarse granularity;
- conversion funnel.

Avoid exposing personally identifying visitor histories to page owners.

## 24. Launch decomposition

This platform is too large for one implementation pass. Build it as independent deliverables.

### Phase 1 — Hynoe Search foundation

- standalone repo/app;
- `hynoe.net` shell;
- search homepage;
- basic Hynoe Page schema/renderer;
- basic search/indexing;
- page types;
- Hynoe Outpost, SMP, and Flicks seed pages;
- `outpost.hynoe.net`, `smp.hynoe.net`, `flicks.hynoe.net` routing;
- mobile/SEO/security baseline.

### Phase 2 — Accounts and owner-managed pages

- auth;
- create/claim flow;
- editor;
- media uploads;
- ownership/team permissions;
- drafts/publishing;
- safe customization.

### Phase 3 — Reviews, trust, and verification

- customer reviews;
- review moderation;
- Hynoe Trust Score inputs;
- verification levels;
- reporting/appeals.

### Phase 4 — Local discovery and service workflows

- distance/location ranking;
- hours/availability;
- inquiries;
- booking adapters;
- category-specific filters.

### Phase 5 — Advanced discovery and monetization

- owner analytics;
- achievements;
- premium themes/domains;
- sponsored results;
- billing;
- enhanced recommendations.

## 25. Phase 1 acceptance criteria

Phase 1 is successful when:

- `hynoe.net` works as a genuine search/discovery homepage rather than a brochure;
- users can search at least the seeded Hynoe properties and discover them by meaningful text/category queries;
- Hynoe Outpost, Hynoe SMP, and Hynoe Flicks each render as clearly different page types using one shared page platform;
- `outpost.hynoe.net` provides an easy direct route into Hynoe Outpost;
- search and pages work cleanly on phone and desktop;
- no Hynoe SMP/YouTube/Bloom/Discord privileged credentials are accessible to the Search app;
- every public result has useful structured metadata and canonical URLs;
- automated tests cover search, routing, page rendering, authorization boundaries, metadata, and unsafe-content handling;
- Hynoe Search can later accept third-party pages without redesigning the core data model.

## 26. Explicit non-goals for Phase 1

- no full-web crawler competing with Google;
- no arbitrary user JavaScript;
- no custom user CSS with unrestricted scope;
- no payments;
- no public ad marketplace;
- no unmoderated open review system;
- no custom password database;
- no direct database sharing with Hynoe SMP;
- no AI-generated ranking black box that cannot be explained or tested;
- no migration away from existing Hynoe-owned domains before redirects/deep links are proven.

## 27. Product success definition

Hynoe Search succeeds when someone can arrive at `hynoe.net`, describe what they want in ordinary language, discover a smaller independent operator or Hynoe product that genuinely fits, understand why the result is trustworthy, and take the next useful action without leaving a confusing trail of unrelated sites.

For page owners, success means Hynoe gives them a discoverable, customizable, mobile-friendly web presence that can function as a practical website before they ever need to build one themselves.
