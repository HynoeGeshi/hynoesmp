# Hynoe Discord Community Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Hynoe Control bridge so ChatGPT can safely audit, restructure, and optimize the full Hynoe Discord community, then deploy and verify the expanded bridge on Render.

**Architecture:** Keep the existing owner-authenticated MCP bridge and Discord REST client, but expand Discord management from a single-channel allowlist into guild-wide administration with explicit risk classification. Read-only inspection and reversible community-organization changes are available normally; destructive moderation, destructive deletions, bulk member-content deletion, and materially broader permission changes require explicit confirmation. Deployment remains on the existing Render web service only.

**Tech Stack:** Node.js 22+, TypeScript 7, Next.js 16, Vitest 5, MCP handler/server, Zod, Discord REST API v10, Supabase OAuth, Render Web Services.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-discord-community-overhaul-design.md`

## Global Constraints

- Repository: `HynoeGeshi/hynoesmp`
- Branch: `feature/hynoe-control-bridge`
- Application directory: `control-bridge`
- Deploy only through the connected Render service `hynoe-control-bridge`; do not use Vercel.
- Preserve existing Bloom tools and owner-only Supabase MCP authentication.
- Use a dedicated Discord bot only; never automate a normal Discord user account or self-bot.
- Do not grant Discord `Administrator` by default.
- Keep `Message Content` intent enabled for bounded activity analysis and recent-message search.
- Keep Presence and Guild Members privileged intents disabled unless a later approved feature truly requires them.
- Never expose `DISCORD_BOT_TOKEN`, Bloom secrets, or Supabase private credentials in source, logs, MCP results, or chat.
- Mass mentions remain blocked unless explicitly allowed per send.
- Destructive member/community actions remain confirmation-gated.
- Preserve useful existing Discord history and integrations where practical; do not begin migration by deleting existing structure.
- Full verification gate before live migration: `npm test`, `npm run typecheck`, `npm run build`, Render deploy, `/health`, read-only Discord inventory, then one reversible temporary-channel write.

## Review Focus

- A caller must not be able to bypass destructive-action confirmation by choosing a different tool or malformed action name.
- Discord role hierarchy failures must produce a clear safe error and must not retry with broader permissions.
- 429/rate-limit and 5xx Discord responses must not trigger duplicate writes.
- Permission overwrite changes that grant staff/bot access more broadly than before must be classified as high-impact and confirmation-gated.
- Message/activity analytics must stay bounded and aggregate-oriented rather than returning invasive member surveillance data.

---

### Task 1: Replace Channel Allowlisting With Guild-Scoped Discord Policy

**Files:**
- Modify: `control-bridge/src/config.ts`
- Modify: `control-bridge/.env.example`
- Replace: `control-bridge/src/policy/discord-policy.ts`
- Modify: `control-bridge/tests/config.test.ts`
- Modify: `control-bridge/tests/policy.test.ts`

**Interfaces:**
- Produces: `DiscordActionRisk = 'read' | 'routine-write' | 'high-impact'`
- Produces: `classifyDiscordAction(action: DiscordActionName): DiscordActionRisk`
- Produces: `assertDiscordActionAllowed(action: DiscordActionName, input: { confirmed?: boolean }): void`
- Produces config flag `discordGuildManagementEnabled: boolean`
- Removes guild-management dependence on `discordAllowedChannelIds` while retaining backward-compatible parsing only if legacy message tools need it during migration.

- [ ] **Step 1: Write failing policy/config tests**

Add tests proving guild management can be enabled without a channel allowlist, legacy allowlist parsing remains compatible when present, routine writes do not require confirmation, and high-impact actions throw unless `confirmed === true`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/config.test.ts tests/policy.test.ts`
Expected: FAIL because guild-management configuration and risk-classification helpers do not exist yet.

- [ ] **Step 3: Implement configuration and risk policy**

Add exact action names for channel/category deletion, role deletion, kick, ban, timeout, bulk member-message deletion, mass member-role changes, materially broader permission updates, and destructive webhook removal as `high-impact`; classify bounded reads as `read`; classify reversible create/edit/reorder/post operations as `routine-write`.

- [ ] **Step 4: Run focused tests**

Run: `cd control-bridge && npx vitest run tests/config.test.ts tests/policy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/config.ts control-bridge/.env.example control-bridge/src/policy/discord-policy.ts control-bridge/tests/config.test.ts control-bridge/tests/policy.test.ts
git commit -m "feat: add guild-wide Discord action policy"
```

### Task 2: Expand Discord REST Types and Client

**Files:**
- Modify: `control-bridge/src/discord/types.ts`
- Modify: `control-bridge/src/discord/client.ts`
- Modify: `control-bridge/tests/discord-client.test.ts`

**Interfaces:**
- Produces types: `DiscordGuild`, `DiscordRole`, `DiscordPermissionOverwrite`, `DiscordWebhook`, `DiscordAuditLog`, `DiscordChannelPatch`, `DiscordRolePatch`.
- Produces client methods for guild inspection, channel CRUD/reorder, role CRUD/reorder, permission overwrite inspection/update, webhook inspection, supported guild/onboarding reads, and explicitly-confirmed moderation endpoints.

- [ ] **Step 1: Write failing client tests**

Add assertions for exact Discord v10 endpoints/methods, JSON bodies, `X-Audit-Log-Reason` support where used, bounded message reads, no automatic retry of write requests on 429/5xx, and preserved `allowed_mentions` behavior.

- [ ] **Step 2: Run client tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/discord-client.test.ts`
Expected: FAIL because the expanded methods/types are absent.

- [ ] **Step 3: Implement the expanded REST client**

Keep one internal request function; surface Discord status/body safely without returning authorization headers or tokens. Do not add a dependency unless the REST surface cannot be implemented cleanly with `fetch`.

- [ ] **Step 4: Run client tests**

Run: `cd control-bridge && npx vitest run tests/discord-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/discord/types.ts control-bridge/src/discord/client.ts control-bridge/tests/discord-client.test.ts
git commit -m "feat: expand Discord management client"
```

### Task 3: Add Read-Only Guild Inventory and Optimization Analytics

**Files:**
- Create: `control-bridge/src/discord/analytics.ts`
- Modify: `control-bridge/src/tools/discord.ts`
- Modify: `control-bridge/tests/discord-tools.test.ts`
- Create: `control-bridge/tests/discord-analytics.test.ts`

**Interfaces:**
- Produces tool methods: `discord_guild_overview()`, `discord_list_roles()`, `discord_list_webhooks()`, `discord_channel_permissions({ channelId })`, `discord_activity_summary({ channelIds?, perChannelLimit? })`.
- Produces `summarizeDiscordActivity(input): DiscordActivitySummary` with aggregate channel-level metrics only.

- [ ] **Step 1: Write failing inventory/analytics tests**

Prove the overview returns guild metadata/categories/channels/roles without credentials, activity reads are bounded to at most 100 messages per channel and a bounded channel count per invocation, and summaries emphasize channel-level counts/replies/activity instead of profiling individual members.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/discord-tools.test.ts tests/discord-analytics.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement inventory and analytics**

Keep existing recent-message/search tools compatible. Guild-wide listing no longer filters channels through the legacy allowlist when guild-management mode is enabled.

- [ ] **Step 4: Run focused tests**

Run: `cd control-bridge && npx vitest run tests/discord-tools.test.ts tests/discord-analytics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/discord/analytics.ts control-bridge/src/tools/discord.ts control-bridge/tests/discord-tools.test.ts control-bridge/tests/discord-analytics.test.ts
git commit -m "feat: add Discord inventory and activity analysis"
```

### Task 4: Add Reversible Channel, Category, Role, and Permission Management

**Files:**
- Modify: `control-bridge/src/tools/discord.ts`
- Create: `control-bridge/tests/discord-management.test.ts`

**Interfaces:**
- Produces routine-write tool methods for create/update/reorder channel/category, create/update/reorder low-risk role, update topics/descriptions, and safe permission-overwrite edits.
- Produces high-impact delete/permission methods that accept `{ confirmed?: boolean }` and call `assertDiscordActionAllowed(...)` before any provider request.

- [ ] **Step 1: Write failing management tests**

Cover create/update/reorder success, deletion blocked without confirmation, broadening a staff/bot permission overwrite blocked without confirmation, role hierarchy/provider errors surfaced safely, and no provider call when policy validation fails.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/discord-management.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement management methods**

Favor rename/move/reorder over delete/recreate so history is preserved. Do not implement bulk destructive migration as one opaque call.

- [ ] **Step 4: Run focused tests**

Run: `cd control-bridge && npx vitest run tests/discord-management.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/tools/discord.ts control-bridge/tests/discord-management.test.ts
git commit -m "feat: add reversible Discord structure management"
```

### Task 5: Add Explicitly-Confirmed Moderation and Destructive Operations

**Files:**
- Modify: `control-bridge/src/tools/discord.ts`
- Create: `control-bridge/tests/discord-high-impact.test.ts`

**Interfaces:**
- Produces: `discord_timeout_member`, `discord_kick_member`, `discord_ban_member`, `discord_unban_member`, `discord_delete_channel`, `discord_delete_role`, `discord_bulk_delete_member_messages`, and guarded mass-role operations.
- Every high-impact method accepts `confirmed: boolean` and refuses execution unless `confirmed === true`.

- [ ] **Step 1: Write failing high-impact tests**

For every high-impact tool, assert `confirmed: false` or omitted prevents all provider writes; `confirmed: true` invokes exactly one intended provider action. Add a test proving no model/content classification alone can trigger punishment.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/discord-high-impact.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement guarded high-impact methods**

Keep owner transfer, billing/Nitro, user-account automation, DMs, and unrestricted arbitrary endpoint access out of scope.

- [ ] **Step 4: Run focused tests**

Run: `cd control-bridge && npx vitest run tests/discord-high-impact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/tools/discord.ts control-bridge/tests/discord-high-impact.test.ts
git commit -m "feat: add confirmed Discord moderation actions"
```

### Task 6: Register the Expanded MCP Tool Surface and Audit Every Write

**Files:**
- Modify: `control-bridge/src/mcp/server.ts`
- Modify: `control-bridge/src/audit.ts`
- Modify: `control-bridge/tests/mcp-server.test.ts`
- Modify: `control-bridge/tests/audit.test.ts`
- Modify: `control-bridge/tests/redact.test.ts`

**Interfaces:**
- `TOOL_NAMES` includes all approved guild-inspection and management tools.
- `WRITE_TOOL_NAMES` includes every mutation.
- High-impact tools use destructive MCP annotations and require the explicit `confirmed` input in addition to MCP review metadata.
- Audit detail records target/action/result metadata but never message bodies, tokens, passwords, or secret headers unless specifically required for a safe operational log.

- [ ] **Step 1: Write failing registration/audit tests**

Assert every mutation appears in `WRITE_TOOL_NAMES`, every destructive action has destructive annotations and confirmation input, routine reads are read-only, and Discord/Bloom secrets remain redacted recursively from provider failures and audit entries.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd control-bridge && npx vitest run tests/mcp-server.test.ts tests/audit.test.ts tests/redact.test.ts`
Expected: FAIL.

- [ ] **Step 3: Register tools and harden audit metadata**

Update MCP instructions to describe guild-wide Discord management, owner-only access, and high-impact confirmation requirements.

- [ ] **Step 4: Run focused tests**

Run: `cd control-bridge && npx vitest run tests/mcp-server.test.ts tests/audit.test.ts tests/redact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/mcp/server.ts control-bridge/src/audit.ts control-bridge/tests/mcp-server.test.ts control-bridge/tests/audit.test.ts control-bridge/tests/redact.test.ts
git commit -m "feat: expose audited Discord admin tools over MCP"
```

### Task 7: Update Owner Consent Copy and Operator Documentation

**Files:**
- Modify: `control-bridge/src/components/ConsentClient.tsx`
- Modify: `control-bridge/README.md`
- Modify: `control-bridge/.env.example`

**Interfaces:**
- Consent UI accurately states that the bridge can inspect/manage the Hynoe Discord guild, while destructive moderation/community actions remain approval-gated.
- README documents granular Discord bot permissions and privileged intents.

- [ ] **Step 1: Update consent and README copy**

Document expected bot permissions: View Channels, Read Message History, Send Messages, Embed Links, Manage Channels, Manage Roles, Manage Messages, View Audit Log, optional Manage Webhooks, and Manage Guild only where needed. Explicitly state `Administrator` is not the default.

- [ ] **Step 2: Verify no stale narrow-scope claims remain**

Run: `cd control-bridge && grep -R "Approved Discord channels\|role management\|member moderation" README.md src/components/ConsentClient.tsx || true`
Expected: No misleading statement saying Discord role management/moderation is categorically unavailable.

- [ ] **Step 3: Commit**

```bash
git add control-bridge/src/components/ConsentClient.tsx control-bridge/README.md control-bridge/.env.example
git commit -m "docs: describe full Hynoe Discord control scope"
```

### Task 8: Full Local Verification Gate

**Files:**
- Modify as required only for defects found by the gate.

**Interfaces:**
- No new interfaces; this task verifies all previous tasks compose correctly.

- [ ] **Step 1: Run complete test suite**

Run: `cd control-bridge && npm test`
Expected: all tests PASS.

- [ ] **Step 2: Run strict typecheck**

Run: `cd control-bridge && npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Run production build**

Run: `cd control-bridge && npm run build`
Expected: successful Next.js production build; MCP route still imports without production secrets during build.

- [ ] **Step 4: Fix only verified failures using TDD/debugging workflow, then rerun the entire gate**

Expected: tests, typecheck, and build all pass in the same final revision.

- [ ] **Step 5: Commit verification fixes if any**

```bash
git add control-bridge
git commit -m "fix: complete Discord control verification gate"
```

Skip the commit if no files changed.

### Task 9: Deploy Through Render and Verify the Expanded Bridge

**Files:**
- No source changes unless deployment exposes a verified portability/runtime defect.

**Interfaces:**
- Deployment target: existing connected Render web service `hynoe-control-bridge` on branch `feature/hynoe-control-bridge`.
- Verification endpoints: `/health`, `/.well-known/oauth-protected-resource`, `/api/mcp`.

- [ ] **Step 1: Inspect the connected Render service configuration**

Confirm repository, branch, application commands, current environment-variable names, and current deploy status through the Render plugin. Do not retrieve or print secret values.

- [ ] **Step 2: Update only required Render environment configuration**

Set the guild-management feature flag/configuration needed by Task 1. Keep `DISCORD_BOT_TOKEN` server-side. Do not use Vercel or copy secrets into GitHub/chat.

- [ ] **Step 3: Trigger a Render deploy from the verified branch revision**

Expected: build runs `npm ci`, tests/typecheck/build gate as configured, then service starts successfully.

- [ ] **Step 4: Verify Render health/logs**

Expected: `/health` is healthy for Discord/Supabase/Bloom dependencies that are configured; logs contain no token material and no repeated Discord write retries.

- [ ] **Step 5: Perform read-only Discord inventory first**

Call `discord_guild_overview`, list roles/channels/webhooks, and read bounded activity summaries. Expected: current live server structure is captured without changing anything.

- [ ] **Step 6: Perform one reversible temporary-channel test**

Create a temporary test channel/category or edit a temporary topic, verify success, then restore/remove it using the confirmation rules if deletion is required.

- [ ] **Step 7: Stop before destructive migration**

Produce the live inventory/classification proposal: keep, rename/move, merge, archive, or remove. Existing history/integrations are preserved until the proposed destructive removals receive explicit confirmation.

### Task 10: Execute the Approved Hynoe Discord Community Migration

**Files:**
- Runtime Discord configuration only; no code changes expected.

**Interfaces:**
- Target top-level architecture: Start Here, Hynoe Community, Hynoe Live & Content, Hynoe SMP, Hynoe Outpost, Hynoe Flicks, Hynoe Culture, Support, Staff / Hynoe Control, hidden Hynoe Services.

- [ ] **Step 1: Apply non-destructive structure changes first**

Create/reuse categories, rename/move compatible existing channels, set topics, and establish private Staff/Hynoe Control space. Do not create an Events category.

- [ ] **Step 2: Create/reconcile purposeful roles**

Core roles: Hynoe, Staff, Moderator, Creator, Member, New Here. Interest roles: Hynoe SMP, Hynoe Outpost, Hynoe Flicks, Streams & Content, Skateboarding, Fitness, Music. Recognition roles only where they serve an actual purpose.

- [ ] **Step 3: Configure onboarding/navigation**

Keep Start Here compact, surface interest areas, and give new members one immediate meaningful action. Avoid long questionnaires.

- [ ] **Step 4: Preserve/reconnect useful integrations**

Verify Minecraft↔Discord server-chat bridge and other active integrations/webhooks before moving or retiring their channels.

- [ ] **Step 5: Validate permissions from member/staff/bot perspectives**

Expected: informational channels are appropriately read-only, private staff areas stay private, community channels remain easy to participate in, and the bot cannot manage roles above its Discord hierarchy position.

- [ ] **Step 6: Apply confirmed destructive cleanup only**

Delete obsolete channels/categories/roles or perform mass member-content actions only after explicit confirmation for the proposed list.

- [ ] **Step 7: Seed lightweight engagement without fake activity**

Add a small initial set of conversation prompts/polls/showcase guidance across General, SMP, Outpost, Flicks, Culture, and content areas. Do not create recurring Events infrastructure until real events exist.

- [ ] **Step 8: Capture post-migration baseline**

Run the activity summary after launch so future optimizations can compare channel activity, replies, participation, and dead-channel signals against a known baseline.
