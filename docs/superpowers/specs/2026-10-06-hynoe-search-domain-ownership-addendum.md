# Hynoe Search — Standalone Domain Addendum

Date: 2026-10-06
Status: Owner-directed correction
Applies to: `2026-10-06-hynoe-search-platform-design.md`

This addendum overrides any part of the main Hynoe Search design that suggests replacing, redirecting away, or demoting the existing standalone Hynoe SMP or Hynoe Flicks websites.

## Canonical domain ownership

The product architecture is:

- `hynoe.net` — Hynoe Search and the Hynoe umbrella/discovery platform.
- `hynoesmp.com` — canonical standalone home for Hynoe SMP. Keep it separate.
- `hynoeflicks.com` — canonical standalone home for Hynoe Flicks. Keep it separate.
- `outpost.hynoe.net` — recommended direct standalone-feeling URL for Hynoe Outpost while Outpost remains part of the Hynoe platform and does not have its own dedicated apex domain.

## Relationship to Hynoe Search

Hynoe Search should index, feature, and richly represent Hynoe SMP and Hynoe Flicks as flagship examples, but their Hynoe Search entries are discovery/profile surfaces, not replacements for their independent sites.

Search result behavior:

- A Hynoe SMP result can show structured information, status, screenshots, features, reviews/trust signals, and a clear `Visit Hynoe SMP` action leading to `hynoesmp.com`.
- A Hynoe Flicks result can show portfolio previews, services, service area, reviews/trust signals, and a clear `Visit Hynoe Flicks` or booking action leading to `hynoeflicks.com`.
- Hynoe Outpost can be both a searchable Hynoe Page and a first-party experience directly hosted at `outpost.hynoe.net`.

## Subdomain rule

Do not make `smp.hynoe.net` or `flicks.hynoe.net` the canonical public homes. They are unnecessary while the dedicated domains exist. If created at all, they should only be convenience redirects to the independent canonical domains, and only if there is a clear user benefit.

## Architecture rule

Hynoe Search is the discovery/hosting umbrella, not a forced migration target. Hynoe-owned businesses and products may retain separate domains and infrastructure while participating fully in Hynoe Search through structured profiles and narrow integrations.

This same principle should eventually be available to third-party page owners: a Hynoe Page can be their entire web presence, or it can act as a discovery profile that links to an independently owned website.
