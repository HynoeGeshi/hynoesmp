# Hynoe Growth Machine Design

## Goal
Turn hynoesmp.com from primarily a branded guide into an acquisition surface that can capture people actively looking for modded Minecraft servers, explain Hynoe quickly, and route qualified visitors to the modpack, Discord, and server.

## Evidence
Live keyword research shows the strongest join-intent opportunity around **modded minecraft servers** (3,600 US monthly searches, SEO difficulty 23), with supporting terms including **modded minecraft server list** (170, SD 18), **modded minecraft servers to join** (50, SD 22), and **modded minecraft servers java** (30, SD 20). The current site has polished branded pages but no page directly framed for that generic discovery intent.

The current site already serves robots.txt and sitemap.xml successfully and exposes a clear server address, modpack path, Discord CTA, long-term campaign, MCA village life, economy, and bosses. The growth work should strengthen discovery without disrupting the recently repaired game/navigation experience.

## Design

### 1. Search-entry landing page
Create `/modded-minecraft-server.html` as an honest single-server landing page for people searching lists/recommendations. It must not pretend Hynoe is a directory. It should:
- target generic join intent naturally in title, description, H1, headings, and body copy;
- immediately state Java/Fabric, server address, and that the custom pack is required;
- explain Hynoe's differentiators: 31-stage campaign, Genesis Ages, MCA village life, player economy/Jobs+, bosses, long-term world, Waystones/exploration;
- provide direct routes to Join, Modpack, Progression, and Discord;
- include a compact FAQ answering platform, pack requirement, server address, progression, and long-term-world questions;
- reuse existing static-site classes and CSP-compatible markup, avoiding new runtime dependencies or inline scripts.

### 2. AI-readable public profile
Create `/llms.txt` with concise canonical facts and links that an assistant or crawler can parse without executing JavaScript. Include what Hynoe is, platform, address, major systems, and canonical pages. This is supplemental discovery metadata, not a claim of guaranteed ranking benefit.

Create `/data/server-profile.json` as stable machine-readable metadata for future directory automation and internal tooling. It should include canonical URL, server address, edition/loader, category tags, key features, join/modpack/Discord URLs, and a last-reviewed date.

### 3. Internal discovery
Link the new landing page from the homepage's existing hero subactions and from the Join page footer. Add it to sitemap.xml. Preserve all existing navigation and game links.

### 4. Listing/outreach kit
Create `/docs/GROWTH_MACHINE.md` with the researched discovery channels and reusable listing copy. Prioritize server-list directories such as mc-servers.com, minecraft-serverlist.com, TopG, Minecraft.Buzz, ServerList's modded category, and comparable Java/modded directories. The doc should include a short description, long description, feature bullets, keyword themes, CTA destination, and a weekly operating loop. No paid-ad requirement.

## Constraints
- Do not break the recently repaired Watch/Game navigation.
- Do not add a framework, build step, or new dependency.
- Keep CSP intact and avoid inline JavaScript.
- Do not claim Bedrock support.
- Do not fabricate player counts, uptime, vote totals, or unsupported features.
- Keep the existing visual language by reusing current CSS classes.
- New acquisition copy should point to the canonical Join/Modpack flows rather than duplicating setup instructions excessively.

## Success criteria
- The site exposes a crawlable page built specifically around generic modded-server discovery intent.
- The new page clearly answers whether Hynoe is a fit before asking for Discord membership.
- Search engines can discover the page through internal links and sitemap.xml.
- AI/research agents can retrieve stable server facts from llms.txt and server-profile.json.
- A reusable directory-listing kit exists so Hynoe can be submitted consistently across discovery sites.
- Existing test suite remains green and new SEO-growth regression tests protect the additions.
