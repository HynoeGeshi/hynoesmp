# Hynoe Outpost Overhaul — Design Spec

Date: 2026-10-05
Status: Proposed for implementation after user review
Branch: `hynoe-outpost-overhaul-2026-10-05`

## 1. Product structure

Use a clear three-level brand architecture:

- **HYNOE™** — master brand owned and presented by Hynoe.
- **Hynoe SMP** — the Minecraft server/community product.
- **Hynoe Outpost™** — working name for the original browser/mobile game currently labeled "Deep & Deeper".

The previous game name should be retired before further promotion because a similar released game name exists and creates avoidable naming risk. "Hynoe Outpost" remains a working product name until a formal trademark clearance search is completed. The site must never imply that a working name is federally registered and must not use the ® symbol unless registration is granted.

## 2. Goals

The overhaul must accomplish four outcomes without destabilizing the live Minecraft site:

1. Make the mining game fully usable and comfortable on phones and tablets.
2. Bring the public homepage up to the visual/interactive quality of the game while making navigation clearer, not busier.
3. Add secure cross-device cloud saves using email-based sign-in without storing application passwords.
4. Reduce preventable legal/security risk before collecting personal data or adding monetization.

## 3. Rollout strategy

Ship in isolated phases with tests and verification between phases.

### Phase A — Mobile game repair and responsive overhaul

Files expected to change:
- `watch.html`
- `assets/watch.css`
- `assets/watch.mjs`
- game regression tests under `tests/`

Requirements:

- Replace the current phone layout that keeps four mine columns on narrow screens.
- Use responsive mine grids:
  - 2 columns on narrow phones.
  - 3 columns on larger phones/small tablets where space permits.
  - 4 columns on desktop.
- Ensure touch targets meet a practical minimum size and are separated enough to prevent accidental taps.
- Prefer Pointer Events for mining interaction so mouse, touch, and pen share one path.
- Prevent duplicate activation from mixed pointer/click behavior.
- Preserve keyboard activation and accessible button semantics.
- Add `touch-action: manipulation` or more specific safe values where useful, but do not disable page scrolling globally.
- Keep hit animation and sound optional and non-blocking.
- Ensure mining taps remain responsive when the mini-player is docked.
- Ensure the mini-player never covers critical game controls on phones.
- Make tabs horizontally scrollable/snap-friendly on small screens rather than compressing labels beyond readability.
- Reflow HUD, stats, guardian controls, operations, crew, leaderboard, research, and campaign sections for small screens.
- Support portrait and landscape phone layouts.
- Reduce purely decorative effects when device width/performance makes them costly.
- Preserve `prefers-reduced-motion` behavior.
- Avoid layout jumps during mining and save updates.

Verification widths:
- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- representative tablet width
- representative landscape phone viewport

Acceptance criteria:
- Every visible vein can be tapped reliably on supported mobile widths.
- A single intentional tap produces one mining action.
- Page scrolling still works normally.
- No horizontal page overflow on tested phone widths.
- Tabs and navigation remain reachable.
- Mini-player does not block primary game actions.
- No console errors during repeated mining.

## 4. Homepage redesign

Files expected to change:
- `index.html`
- `assets/styles.css`
- potentially `assets/common.js`
- homepage-specific tests

Design direction:

The homepage should feel like the same product family as Hynoe Outpost while remaining the main Hynoe SMP entry point. It should become cleaner, more visual, and more action-oriented instead of simply adding more sections.

### Homepage information hierarchy

1. **Hero / world gateway**
   - Strong Hynoe logo treatment.
   - Immediate explanation of what Hynoe SMP is.
   - Three dominant actions: Join, Get the Pack, Watch & Play.
   - Avoid too many equal-priority buttons.

2. **Live-looking world dashboard**
   - Campaign state summary.
   - Genesis Ages.
   - Village life.
   - Economy.
   - Boss/gear progression.
   - These are visual navigation cards, not fake real-time telemetry.

3. **Hynoe Outpost feature panel**
   - Present the web game as an original Hynoe product.
   - Explain the loop: mine → build → collect crew → explore → legacy.
   - Clear play CTA.

4. **New-player path**
   - Install pack.
   - Join server.
   - First-hour guide.

5. **World systems**
   - Visual cards for progression, villages, economy, bosses, exploration.

6. **Recent updates**
   - Compact timeline/card treatment.
   - Keep dates and rollout caveats accurate.

7. **Community / watch / support**
   - Discord and stream entry points.
   - Maintain Mojang/Microsoft non-affiliation disclosure.

Mobile homepage requirements:
- No large decorative element should force sideways scrolling.
- Primary actions remain above the fold or immediately reachable.
- Cards collapse to one or two columns based on width.
- Header/navigation becomes compact and thumb-friendly.
- Important content must not depend on hover.
- Images/decorative assets should be responsive and lazy-loaded when appropriate.

## 5. Hynoe Outpost identity migration

Rename visible game branding from "Deep & Deeper" to the working name "Hynoe Outpost" in UI, metadata, documentation, and tests.

Do not rename internal save keys immediately if doing so would lose local progress. Existing localStorage keys should be migrated safely:

- Read legacy key first.
- Write to the new key after successful restore.
- Preserve a compatibility window so returning players do not lose progress.

Avoid introducing third-party game artwork, copyrighted characters, or Minecraft-owned assets into the original Hynoe Outpost game. Prefer original Hynoe visuals, names, iconography, cards, lore, and UI.

## 6. Secure account and cloud-save architecture

### Authentication

Use Supabase Auth with passwordless email:
- Email magic link and/or OTP.
- No application-managed password database.
- No service-role key in browser code.
- Use only a publishable client key in the browser.

A Supabase project does not currently exist in the connected account, so project creation requires a separate cost/organization confirmation before implementation.

### Save model

Suggested table: `game_saves`

Core fields:
- `user_id uuid primary key references auth.users(id)`
- `save_version integer not null`
- `revision bigint not null default 0`
- `payload jsonb not null`
- `updated_at timestamptz not null`
- optional checksum/integrity metadata if useful

Do not store raw email addresses redundantly in the save table unless there is a specific need. Supabase Auth already owns identity data.

### Row Level Security

Enable RLS on every exposed table.

Policies must restrict all reads/writes to the authenticated owner:

- SELECT: `auth.uid() = user_id`
- INSERT: authenticated user may insert only their own `user_id`
- UPDATE: `USING` and `WITH CHECK` both require `auth.uid() = user_id`
- DELETE: only owner may delete their own save

Do not rely on `TO authenticated` alone; ownership must be checked.

### Save validation

Never trust an arbitrary JSON upload simply because the user owns the row.

Before accepting a cloud save:
- Require a supported save version.
- Validate type and shape.
- Clamp or reject impossible numeric values using the same bounds enforced by local restore logic.
- Reject unknown privileged fields.
- Cap payload size.
- Use optimistic concurrency (`revision`) to avoid silent cross-device overwrites.
- Rate-limit save writes.

Prefer a trusted server-side validation path (Supabase Edge Function or similarly protected endpoint) for cloud writes if direct table writes cannot enforce sufficient validation.

### Offline/local behavior

- Local save remains first-class.
- Signed-out players can continue playing locally.
- Signing in offers a safe merge/choice flow if both local and cloud progress exist.
- Never silently replace the more advanced save.
- Show last cloud sync status.
- Queue/retry transient sync failures without blocking gameplay.

### Account deletion

Provide an explicit user-facing path to:
- delete cloud save data;
- request/delete account data as supported by the auth system;
- understand what local browser data remains on their device.

## 7. Security requirements

Before production cloud saves:

- No secrets committed to GitHub.
- No service-role or moderation/admin tokens in browser JavaScript.
- Content Security Policy updated only for exact required Supabase origins.
- Tight CORS on any custom endpoint.
- RLS enabled and tested.
- Security advisors run after schema changes.
- Auth/session handling reviewed against current Supabase documentation/changelog.
- Save payload size limits.
- Input validation on every server-side write path.
- Rate limiting on auth-adjacent/custom endpoints where applicable.
- HTTPS only.
- Avoid authorization decisions based on user-editable metadata.
- Dependency versions pinned with lockfiles if packages are introduced.
- Add regression tests for unauthorized cross-user reads/writes.
- Add tests for malformed or inflated save payloads.

## 8. Privacy / terms / lawsuit-risk reduction

Before collecting email addresses, publish site-accessible:

- Privacy Policy.
- Terms of Use.
- Account/cloud-save deletion information.
- Community/chat rules or acceptable-use language where appropriate.
- Copyright/IP notice and infringement/contact path.
- Clear Minecraft/Mojang/Microsoft non-affiliation disclosure.

The legal pages should accurately describe actual data collection and retention. They must not claim security or privacy guarantees the implementation cannot support.

Because online games can be used by minors, do not casually collect email from known under-13 users. The final launch flow must either:
- restrict account/cloud-save creation to users meeting the chosen age threshold; or
- implement a legally appropriate child-privacy/parental-consent flow with qualified legal review.

This spec does not attempt to replace legal advice. Trademark filing classes, privacy language, COPPA strategy, liability clauses, business entity structure, and monetization terms should receive attorney review before substantial commercial launch.

## 9. Trademark / brand protection workstream

Before treating HYNOE or Hynoe Outpost as fully cleared:

- Search USPTO federal records for identical and confusingly similar marks.
- Search state/business/common-law uses where relevant.
- Search app stores, game platforms, domains, social platforms, and general web results.
- Record evidence of first use and continuous use where relevant.
- Keep original logo/source files and dated repository history.
- Consider filing HYNOE as the master word mark first, then logo/game marks based on counsel and commercial priorities.
- Use ™ where appropriate before registration; do not use ® until registered.

## 10. Test and verification strategy

### Automated

- Existing full Node suite must remain green.
- Add touch/pointer interaction regression coverage where practical.
- Add responsive-content structural tests.
- Add save migration tests for legacy/local keys.
- Add cloud-save serializer/validator tests before backend integration.
- Add security tests for public assets and secret leakage.
- Add legal-page existence/link tests before email collection is enabled.

### Browser verification

Use browser automation to verify:
- Homepage loads with no console errors.
- Watch/game page loads with no console errors.
- Phone-width navigation is usable.
- Mining works repeatedly with touch/pointer emulation.
- Mini-player does not cover controls.
- Tabs and room cards are reachable.
- Sign-in UI behaves correctly once implemented.
- Signed-out local play still works.

### Security verification

When Supabase exists:
- Run Supabase security advisors.
- Explicitly test user A cannot read/write user B save.
- Verify anonymous users cannot access cloud-save rows.
- Verify browser bundle contains no secret/service-role key.

## 11. Release gates

### Gate A — mobile repair
Ship only after mobile mining and responsive game verification passes.

### Gate B — homepage redesign + Hynoe Outpost visual rename
Ship only after desktop/mobile visual verification and existing site tests pass.

### Gate C — cloud saves
Do not enable publicly until:
- Supabase project is configured.
- Auth works.
- RLS is verified.
- save validation is verified.
- Privacy/Terms pages are live.
- deletion path exists.
- security advisor findings are addressed or documented.

## 12. Non-goals for this pass

- No payment/microtransaction system yet.
- No native iOS/Android app yet.
- No social-login providers unless later requested.
- No custom password authentication.
- No claim that trademark registration is complete.
- No use of Minecraft/Mojang assets to brand Hynoe Outpost as an original standalone game.

## 13. Final success criteria

The project is successful when:

- The game is comfortable and reliable on modern phones.
- The main site visually feels as polished as the game while being easier to navigate.
- Existing users keep local progress through the game rename.
- Cross-device saves work through secure email authentication.
- One user cannot access another user's save.
- No privileged secrets ship to the browser or repository.
- Privacy/terms/deletion paths exist before email storage is enabled.
- HYNOE, Hynoe SMP, and Hynoe Outpost each have a clear product role and avoid misleading trademark claims.
