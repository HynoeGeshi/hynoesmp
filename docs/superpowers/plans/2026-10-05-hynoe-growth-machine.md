# Hynoe Growth Machine Implementation Plan

**Goal:** Build an organic-acquisition layer for Hynoe SMP that captures generic modded-Minecraft join intent, gives search/AI systems stable server facts, and creates a repeatable external-listing workflow without breaking the current site/game.

**Spec:** `docs/superpowers/specs/2026-10-05-hynoe-growth-machine-design.md`

## Global constraints
- Static site only; no new framework or dependency.
- Preserve current CSP and Watch/Game navigation.
- Never claim Bedrock support, player counts, uptime, ratings, or features that are not verified.
- Reuse existing visual classes where possible.
- Production behavior must be protected by tests before implementation.

## Task 1 — Growth regression tests
**Files:** `tests/growth.test.mjs`, `.github/workflows/growth-branch-tests.yml`

Write Node tests that require:
1. `modded-minecraft-server.html` with a canonical URL, H1, the phrase `modded Minecraft server`, server address, Join/Modpack links, and no Bedrock claim.
2. `llms.txt` with canonical site URL, join URL, modpack URL, and server address.
3. `data/server-profile.json` that parses and declares Java + Fabric + address + canonical URLs.
4. `sitemap.xml`, `index.html`, and `join.html` link to the new discovery page.
5. Growth files contain no unsupported player-count/uptime/ranking claims.

Run with `node --test tests/*.test.mjs`. First branch run must fail because production files/links do not exist yet.

## Task 2 — Search-intent acquisition page
**Files:** `modded-minecraft-server.html`, `index.html`, `join.html`, `sitemap.xml`

Create an honest single-server landing page aimed at people searching for modded Minecraft servers to join. Include clear Java/Fabric/pack facts, server address, current feature set, who the server is for, direct CTAs, and a visible FAQ. Link it from the homepage and Join page and add it to the sitemap.

## Task 3 — AI-readable server profile
**Files:** `llms.txt`, `data/server-profile.json`

Publish stable, concise facts that do not require JavaScript to understand. Keep them factual and canonical so future agents/listing automation have a trustworthy source.

## Task 4 — Reusable distribution kit
**Files:** `docs/GROWTH_MACHINE.md`

Create directory-ready short/long descriptions, tags, feature bullets, canonical destination links, researched discovery targets, and a weekly operating loop. Focus on organic/free acquisition; do not fabricate submissions.

## Task 5 — Verify branch
Run the full Node test suite through GitHub Actions. Inspect the workflow result and changed files. Re-crawl the branch only if a preview URL exists; otherwise inspect generated source directly.

## Task 6 — Publish and index
After the branch is green, integrate into `main` under the user's standing instruction to put the plan in play. Verify `https://hynoesmp.com/modded-minecraft-server.html`, sitemap, llms.txt, and server-profile.json return successfully. If a verified Search Console property exists, submit/inspect the new URL; otherwise record the account connection blocker without pretending submission succeeded.
