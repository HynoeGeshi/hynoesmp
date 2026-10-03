# Deep & Deeper: persistent progression release

The previous six realms were visual milestones driven entirely by ore. They are now the mining layer beneath a separate 12-chapter permanent campaign. Existing ore, equipment purchases, relics, and Legacy progress remain intact. Old saves begin the new campaign at chapter one and may claim requirements they have already met. Historical discoveries are not duplicated into spendable crafting materials.

## Implemented
- Permanent campaign with mixed mining, equipment, research, guardian, expedition, and Legacy goals.
- Three research specializations, 34 ranks total; three crafted items, 20 levels each.
- Seven material inventories; vein breaks award materials. Field expeditions supply targeted materials, coal, and Insight.
- Six field expedition sectors, progressively unlocked, with 5/15/30/60/120/240-minute routes. Field crew and existing relic crew run independently. Rewards remain available until collected, with no missed-day penalty.
- Deterministic supply exchange: Insight can fund research or materials for equipment.
- Four cosmetic styles earned through campaign milestones.
- Repeatable post-campaign mastery, with a permanent 5% × square-root(rank) bonus to active and idle mining. Equipment, research, materials, chapters, and field trips survive Legacy resets.
- Pure progression module and save migration independent of UI. Existing save key and export format retained.

## Pacing evidence
A synthetic continuously active player, opening roughly one strike per second, buying upgrades, crafting, researching, fighting guardians, and selecting required sectors reached chapter counts 4 at 15 minutes, 6 at one hour, 8 at four hours, 10 at twelve hours, 11 at twenty-four hours, and 12 within forty-eight hours. This is a simulation, not a retention measurement or a promised completion time. Different strategies, idle time, and supply trades change pacing. Even a test with unlimited ore and completed non-expedition requirements cannot clear the campaign in fifteen minutes. There are no energy purchases or paid shortcuts.

## Before a monetized app
This release is still a local browser game. A user can edit a local save or their device clock. It is not an authoritative economy and must not grant paid entitlements or competitive rewards.

The next production phase needs account-bound server-owned inventories and timers; an append-only grant/spend ledger; idempotent purchase verification and refund/revocation handling; cloud-save conflict resolution; restore-purchases; and platform-specific store integration. Keep paid cosmetic entitlements separate from earned currencies and client save imports. Do not convert locally edited currency into purchased or transferable value.

Prefer fixed-price cosmetic themes, pickaxe effects, and companion appearances. Preserve the full progression loop without spending, and avoid selling random rewards or solutions to artificial difficulty. No checkout, real-money currency, receipt handling, analytics collection, or app-store release is included in this update.

Measure voluntary return sessions, chapter completion, stalled objectives, build diversity, and satisfaction with consent-appropriate instrumentation before claiming long-term retention. Balance against actual playtest feedback; more time alone is not depth.
