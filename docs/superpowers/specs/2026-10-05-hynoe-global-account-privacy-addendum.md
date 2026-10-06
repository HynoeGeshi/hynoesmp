# Hynoe Global Account & Privacy Addendum

Date: 2026-10-05
Status: Approved direction from owner
Applies to: `docs/superpowers/specs/2026-10-05-hynoe-outpost-overhaul-design.md`

## Product reality

Hynoe SMP and Hynoe Outpost are intended for a worldwide audience. Account, cloud-save, chat, leaderboard, analytics, support, and future monetization design must therefore use a conservative global privacy baseline rather than an Illinois-only baseline.

This document is an engineering/product risk baseline, not a substitute for advice from qualified counsel in relevant jurisdictions.

## Launch rule for personal-data features

At initial launch:

- Local Hynoe Outpost play remains available without an account and without collecting an email address.
- Cloud-save accounts are **18+ only**.
- Account-backed public chat, persistent public profile identity, and account-backed leaderboard submission are **18+ only** initially.
- A neutral age gate appears before any account email field or account-backed social feature.
- Do not request or retain full date of birth unless qualified legal review later determines it is necessary.
- Under-18 users who identify themselves as minors must be routed to local-only play without entering an email address.
- If the operator later obtains actual knowledge that an account holder is a child where child-privacy law applies, stop collection/use not legally supportable and follow the applicable deletion/parental-consent process rather than continuing normal account processing.

The 18+ policy reduces child-account complexity; it does **not** eliminate general privacy obligations for adult users.

## Global privacy baseline

Before worldwide cloud accounts are enabled, Hynoe must provide and operationally support:

- a clear Privacy Policy available before personal data is submitted;
- Terms of Use and Community Rules;
- a public privacy/contact channel;
- disclosure of the categories of personal data collected, purposes, legal bases where applicable, processors/vendors, retention periods or criteria, and international transfer information where applicable;
- access, correction, deletion, and export/portability workflows where legally required;
- account and cloud-save deletion;
- data minimization and storage limitation;
- encryption in transit and appropriate provider-side encryption at rest;
- reasonable technical and organizational security measures;
- an incident/breach response procedure;
- processor/vendor agreements appropriate to the data handled;
- no sale of personal data and no behavioral advertising at initial account launch;
- no unnecessary precise geolocation, contact-list access, biometric data, government IDs, or sensitive profiling;
- no non-essential tracking cookies/SDKs until jurisdiction-appropriate consent and disclosure handling exists;
- a documented retention schedule rather than indefinite retention by default.

## EU / EEA baseline

If Hynoe offers accounts/services to people in the EU/EEA, design for GDPR applicability even though the operator is located in the United States.

Engineering/product requirements include:

- identify and document the lawful basis for each processing purpose;
- provide GDPR-required transparency at collection;
- support data-subject access, rectification, erasure, restriction/objection where applicable, and portability where applicable;
- respond to rights requests within applicable legal deadlines;
- use data protection by design/default and collect only what the feature needs;
- document international data-transfer safeguards used by processors/providers;
- complete a DPIA where the nature/risk of processing requires one;
- do not turn age assurance into unnecessary identification, location tracking, or profiling.

## United Kingdom baseline

The UK Children's Code can apply to non-UK online games/services when UK children are likely to access them. Therefore:

- local-only play should remain low-data and privacy-protective by default;
- do not assume an "18+ accounts" Terms clause alone proves children cannot access the wider game/site;
- account/social age assurance must be proportionate and privacy-preserving;
- child-access risk must be reassessed before enabling under-18 accounts or new tracking/social features.

## United States baseline

- COPPA applies to child-directed services and general-audience services with actual knowledge of under-13 personal-data collection; email and persistent identifiers can be covered personal information.
- Use a neutral age screen before account data collection.
- Illinois personal-data records must receive reasonable security measures under the Illinois Personal Information Protection Act.
- The product must track other applicable U.S. state privacy laws as Hynoe's user count, revenue, advertising practices, and data practices change.

## Technical account architecture

Cloud saves must use:

- passwordless email authentication;
- a publishable browser key only;
- no service-role/private key in browser code, GitHub, logs, or screenshots;
- per-user Row Level Security on every exposed save/account-data table;
- trusted validation for cloud-save writes;
- payload size limits and numeric/value bounds;
- optimistic concurrency/revision control;
- rate limits;
- secure deletion paths;
- audit/security-advisor checks before launch;
- local-storage fallback so an account is not required to play.

Do not redundantly store raw email addresses in gameplay tables when the authentication provider already holds the account identity.

## Worldwide release gate

Cloud accounts, account-backed social features, or collection of account emails must remain disabled until all of the following are true:

1. Privacy Policy, Terms, Community Rules, and deletion information are live.
2. The actual deployed data flow matches those documents.
3. Age gate is implemented before account data entry.
4. Under-18 path remains local-only at launch.
5. Supabase/Auth RLS and cross-user isolation tests pass.
6. No privileged secret is present in public code or responses.
7. Data export/access/deletion operational paths are tested.
8. Security advisors are reviewed and high-risk findings resolved.
9. Vendor/data-transfer terms are documented for the chosen hosting/auth providers.
10. Qualified legal review is obtained before material monetization, under-18 accounts, targeted advertising, or other higher-risk personal-data features.

## Sources checked for this addendum

Authoritative guidance checked during design includes the U.S. Federal Trade Commission COPPA guidance, Illinois Personal Information Protection Act, European Commission GDPR guidance, European Data Protection Board age-assurance guidance, and UK ICO Children's Code guidance. Laws and guidance change; re-check them before the account feature ships.