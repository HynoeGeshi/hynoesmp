# Hynoe SMP Mobile + Sitewide Refresh Design

## Goal
Make the Hynoe SMP site feel consistently redesigned on every public page, with a phone-first Hynoe Outpost that never clips mining cards/text, never double-fires a tap, and keeps the primary stream-watching flow on hynoesmp.com.

## Problems confirmed
- Hynoe Outpost mobile mining uses a fixed/clipped scene while rendering twelve vein cards, so lower cards/text can be clipped on narrow phones.
- `assets/watch-mobile.mjs` adds a manual `pointerup` activation on top of the normal click handler, creating competing activation/animation paths.
- The homepage stream script rewrites the primary stream CTA to an external YouTube URL even though an on-site player exists.
- Most guide pages still depend on older base layout/visuals and are only lightly enhanced by `common.js`, so the homepage feels much newer than the rest of the site.

## Design
### Mobile Outpost
Use native click activation only. Mobile CSS will put the mine into normal document flow, keep two columns on narrow phones and three on tablets, give vein cards enough height for crystal + label + taps-left text, and guarantee the twelfth card stays inside the mine container. Decorative layers remain behind the controls and cannot capture taps. Text sizes increase on narrow phones and tap feedback uses the existing single click path.

### Stream playback
Add a dedicated on-site watch module. `Play latest stream` loads the current `data/stream.json` video into the Hynoe Watch page with a `youtube-nocookie.com` iframe without navigating away. The homepage's primary broadcast CTA points to `watch.html#video` and is labeled as watching on Hynoe; an explicit secondary YouTube link may remain for users who choose to leave the site.

### Sitewide visual system
Add one final shared stylesheet loaded after existing page-specific CSS. It will unify page width, header/hotbar behavior, mission cards, section/card surfaces, hero readability, mobile spacing, typography, button sizing, horizontal-scroll controls, and per-page accents across the World, Start, Village, Progression, Economy, Bosses, Join, Modpack, Updates, discovery/SEO landing page, Watch, and legal pages. Existing page content and SEO copy remain intact.

### Verification
Static tests must prove every public page loads the shared refresh layer, the touch bridge no longer manually fires pointer events, and the on-site player module is wired. Browser tests must run at 320, 360, 375, 390, 412, and 430 px widths for Watch, assert no horizontal overflow, verify all twelve vein cards and both label lines are visible and inside the mine scene, verify one tap changes state exactly once, and verify the on-site watch button creates an iframe without leaving the page. A 390 px smoke test will visit every public page and assert the refresh layer is present, primary content is visible, and the page has no horizontal overflow.

## Non-goals
- Do not change Hynoe Outpost progression/economy balance.
- Do not re-enable global leaderboard uploads.
- Do not remove the optional external YouTube destination entirely.
- Do not rewrite legal copy or server-guide facts.
