# Deep & Deeper: persistent progression release

The previous six realms were visual milestones driven entirely by ore. They are now the mining layer beneath a separate 12-chapter permanent campaign. Existing ore, equipment purchases, relics, and Legacy progress remain intact. Old saves begin the new campaign at chapter one and may claim requirements they have already met. Historical discoveries are not duplicated into spendable crafting materials.

## Implemented
- Permanent campaign with mixed mining, equipment, research, guardian, expedition, and Legacy goals.
- Three research specializations, 34 ranks total; three crafted items, 20 levels each.
- Seven material inventories; vein breaks award materials. Field expeditions supply targeted materials, coal, and Insight.
- Six playable cave-run sectors, progressively unlocked, with 5–15 rooms each. Players choose safer scouting, riskier mining, or fortifying the crew; rewards are earned immediately through play rather than timers.
- Relic expeditions are now active mining hunts. Their 5/15/30 goals count veins opened instead of minutes waited.
- Deterministic supply exchange: Insight can fund research or materials for equipment.
- Four cosmetic styles earned through campaign milestones.
- Repeatable post-campaign mastery, with a permanent 5% × square-root(rank) bonus to active and idle mining. Equipment, research, materials, chapters, and field trips survive Legacy resets.
- Pure progression module and save migration independent of UI. Existing browser saves migrate automatically. File import/export was removed because editable save files made local progression trivial to fake.

## Pacing evidence
A synthetic super-active player, mining and making a cave-run decision roughly every second while also buying upgrades, crafting, researching, and fighting guardians, reached chapter 6 at 15 minutes, chapter 9 at one hour, and chapter 12 at four hours. This is deliberately far faster than normal human play and is a regression ceiling, not a retention measurement or promised completion time. Normal players must read encounters, manage health, mine required veins, build the correct sectors, and complete varied objectives. Repeatable mastery, research builds, equipment, relics, challenges, collections, and Legacy progression continue after chapter 12. There are no energy purchases or paid shortcuts.

## Before a monetized app
This release is still a local browser game. Import/export is disabled and impossible numeric combinations are clamped, which removes the easy edited-file shortcut. A determined user can still alter browser storage or client code. It is not an authoritative economy and must not grant paid entitlements or competitive rewards.

The next production phase needs account-bound server-owned inventories and timers; an append-only grant/spend ledger; idempotent purchase verification and refund/revocation handling; cloud-save conflict resolution; restore-purchases; and platform-specific store integration. Keep paid cosmetic entitlements separate from earned currencies and client save imports. Do not convert locally edited currency into purchased or transferable value.

Prefer fixed-price cosmetic themes, pickaxe effects, and companion appearances. Preserve the full progression loop without spending, and avoid selling random rewards or solutions to artificial difficulty. No checkout, real-money currency, receipt handling, analytics collection, or app-store release is included in this update.

Measure voluntary return sessions, chapter completion, stalled objectives, build diversity, and satisfaction with consent-appropriate instrumentation before claiming long-term retention. Balance against actual playtest feedback; more time alone is not depth.
