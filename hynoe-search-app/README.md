# Hynoe Search

Hynoe Search is the discovery layer for the HYNOE ecosystem: independent businesses, creators, services, communities, games, and projects surfaced through structured Hynoe Pages.

## Phase 1

The first public MVP includes deterministic search, typed/safe Hynoe Pages, responsive discovery UI, SEO metadata, host routing for `outpost.hynoe.net`, and three real flagship entries:

- Hynoe Outpost — interactive Hynoe product
- Hynoe SMP — independent community at `hynoesmp.com`
- Hynoe Flicks — independent creative business at `hynoeflicks.com`

## Isolation

This application is intentionally separate from Hynoe SMP and other Hynoe automation systems. It must not share privileged credentials, databases, or admin secrets with those systems.

## Development

```bash
npm install
npm test
npm run dev
```

Production verification requires `npm run build` and the Playwright suite before domain changes.
