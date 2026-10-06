# Hynoe Control Bridge Render Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing Hynoe control bridge to Render, preserve its fail-closed security model, verify Bloom and Discord access, and expose the authenticated MCP endpoint for ChatGPT.

**Architecture:** Keep the current Next.js bridge unchanged unless verification finds a concrete portability bug. Deploy `control-bridge` from `feature/hynoe-control-bridge` as a Render Node web service, store credentials only in Render environment variables, then validate health, OAuth/MCP discovery, Discord allowlisting, and Bloom access before enabling ongoing deploys.

**Tech Stack:** Node.js 22+, Next.js 16, MCP handler/server, Supabase OAuth, Discord REST API v10, Bloom/Pterodactyl API, Render Web Services.

**Spec:** `docs/superpowers/specs/2026-10-06-render-control-bridge-design.md`

## Global Constraints

- Repository: `HynoeGeshi/hynoesmp`
- Branch: `feature/hynoe-control-bridge`
- Application directory: `control-bridge`
- Node.js version floor: `>=22`
- Render region: `ohio`
- Initial Render plan: `free`
- Render service name: `hynoe-control-bridge`
- Build command: `cd control-bridge && npm ci && npm run build`
- Start command: `cd control-bridge && npm start`
- Keep auto-deploy disabled until the first verified healthy deployment.
- Never commit Bloom, Discord, or Supabase credentials to GitHub.
- Preserve Discord guild/channel allowlisting, mass-mention blocking, bot-own-message deletion only, and minimal bot permissions.
- Keep Bloom panel origin locked to `https://mc.bloom.host`.
- Keep Supabase OAuth as the MCP owner-authentication layer.

## Review Focus

- Missing required environment variables must fail closed instead of starting with partial access.
- `BLOOM_PANEL_URL` values outside `https://mc.bloom.host` must be rejected.
- Empty `DISCORD_ALLOWED_CHANNEL_IDS` must be rejected.
- Wrong guild/channel credentials must not widen Discord access or silently fall back to unrestricted access.
- `PUBLIC_BASE_URL` must match the final Render HTTPS origin so OAuth metadata and callbacks are internally consistent.

---

### Task 1: Verify the Existing Bridge Is Deployable Without Code Changes

**Files:**
- Read: `control-bridge/package.json`
- Read: `control-bridge/src/config.ts`
- Test: `control-bridge/tests/config.test.ts`
- Test: `control-bridge/tests/health.test.ts`
- Test: `control-bridge/tests/discord-tools.test.ts`
- Test: `control-bridge/tests/bloom-tools.test.ts`
- Test: `control-bridge/tests/mcp-server.test.ts`

**Interfaces:**
- Consumes: the approved feature branch and existing bridge implementation.
- Produces: a verified build/test baseline and confirmation that no Render-specific code change is required.

- [ ] **Step 1: Run the existing test suite**

Run: `cd control-bridge && npm ci && npm test`

Expected: all Vitest tests pass, including config, Discord policy/tools, Bloom tools, health, redaction, and MCP server tests.

- [ ] **Step 2: Run typechecking**

Run: `cd control-bridge && npm run typecheck`

Expected: exit code `0` with no TypeScript errors.

- [ ] **Step 3: Run the production build**

Run: `cd control-bridge && npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 4: Confirm fail-closed config tests cover the Render-sensitive cases**

Verify `control-bridge/tests/config.test.ts` asserts:
- missing required values throw;
- non-HTTPS URLs are rejected;
- Bloom host is restricted to `mc.bloom.host`;
- empty Discord channel allowlist is rejected.

Expected: each review-focus condition owned by config is represented by a passing test.

- [ ] **Step 5: Commit only if Task 1 reveals a real portability bug**

If no code change is required, make no commit. If a minimal portability fix is required, use TDD and commit only that fix with its test.

---

### Task 2: Provision the Render Service Safely

**Files:**
- No source-code file changes expected.

**Interfaces:**
- Consumes: verified build/start commands from Task 1.
- Produces: Render service ID and canonical HTTPS origin for later environment configuration.

- [ ] **Step 1: Create the Render web service**

Create with:
- workspace: `Tstew's workspace`
- name: `hynoe-control-bridge`
- repository: `https://github.com/HynoeGeshi/hynoesmp`
- branch: `feature/hynoe-control-bridge`
- runtime: `node`
- region: `ohio`
- plan: `free`
- build command: `cd control-bridge && npm ci && npm run build`
- start command: `cd control-bridge && npm start`
- auto deploy: `no`

Expected: Render returns a service ID and HTTPS service URL.

- [ ] **Step 2: Record the canonical Render HTTPS origin**

Expected: origin has the form `https://<render-host>` and is used exactly as `PUBLIC_BASE_URL`.

- [ ] **Step 3: Confirm no secrets are present in repository source or build logs**

Expected: no Bloom API key, Discord bot token, or Supabase credential appears in GitHub or Render build output.

---

### Task 3: Configure Required Environment Variables Without Exposing Secrets

**Files:**
- No source-code file changes expected.

**Interfaces:**
- Consumes: Render service ID and canonical HTTPS origin from Task 2.
- Produces: complete runtime configuration required by `loadConfig()`.

- [ ] **Step 1: Set non-secret fixed values**

Set:
- `BLOOM_PANEL_URL=https://mc.bloom.host`
- `PUBLIC_BASE_URL=<canonical Render HTTPS origin>`
- `AUDIT_LOG_ENABLED=true`

Expected: Render stores all three values on the service.

- [ ] **Step 2: Set Bloom credentials from a secure source**

Set:
- `BLOOM_API_KEY`
- `BLOOM_SERVER_ID`

Expected: values exist in Render only; they are never committed to GitHub or echoed into chat/log output.

- [ ] **Step 3: Set Discord credentials and allowlist from a secure source**

Set:
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_ALLOWED_CHANNEL_IDS`

Expected: channel list is explicit and non-empty; no wildcard or unrestricted fallback is used.

- [ ] **Step 4: Set Supabase OAuth values from a secure source**

Set:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `ALLOWED_SUPABASE_USER_ID`

Expected: values correspond to the owner-authentication Supabase project and authorized user.

- [ ] **Step 5: Re-read the service configuration without requesting decrypted secret values**

Expected: every required key exists; secret plaintext is not surfaced.

---

### Task 4: Deploy and Verify the Bridge End to End

**Files:**
- No source-code file changes expected unless verification exposes a real bug.

**Interfaces:**
- Consumes: fully configured Render service from Task 3.
- Produces: a healthy deployed MCP bridge with verified Bloom/Discord controls.

- [ ] **Step 1: Trigger the first deployment**

Expected: build completes and service reaches a running/available state.

- [ ] **Step 2: Inspect Render events and logs for startup failures**

Expected: no missing-environment-variable error, no leaked credential, no non-zero startup exit.

- [ ] **Step 3: Verify `/health`**

Request: `GET <PUBLIC_BASE_URL>/health`

Expected: healthy response from the existing health route.

- [ ] **Step 4: Verify OAuth protected-resource metadata**

Request: `GET <PUBLIC_BASE_URL>/.well-known/oauth-protected-resource`

Expected: metadata references the same Render origin and MCP resource.

- [ ] **Step 5: Verify the MCP endpoint requires authentication**

Request: `<PUBLIC_BASE_URL>/api/mcp`

Expected: unauthenticated requests do not gain tool access; authenticated owner flow succeeds.

- [ ] **Step 6: Run the MCP smoke-test sequence**

Run in order:
1. `hynoe_status`
2. `bloom_server_status`
3. `discord_list_channels`
4. `discord_recent_messages` in one allowlisted test channel
5. `discord_send_message` in that same test channel
6. Bloom command `list`

Expected: every read/write stays within the approved Discord channel set and Bloom server.

- [ ] **Step 7: Exercise the two highest-risk Discord policy checks**

Verify:
- sending `@everyone` or `@here` is blocked unless explicitly approved;
- deleting a message not authored by the bot is rejected.

Expected: both actions fail safely.

- [ ] **Step 8: Enable auto-deploy only after verification**

Expected: service remains healthy and future changes on `feature/hynoe-control-bridge` can deploy automatically if desired.

---

### Task 5: Connect the Verified MCP Bridge to ChatGPT

**Files:**
- No repository change expected.

**Interfaces:**
- Consumes: verified Render MCP endpoint and Supabase OAuth flow.
- Produces: ChatGPT access to the approved Hynoe control tools.

- [ ] **Step 1: Register the deployed MCP endpoint in ChatGPT**

Endpoint: `<PUBLIC_BASE_URL>/api/mcp`

Expected: ChatGPT discovers the OAuth metadata and begins the owner authorization flow.

- [ ] **Step 2: Complete owner authorization through Supabase**

Expected: only `ALLOWED_SUPABASE_USER_ID` is accepted.

- [ ] **Step 3: Re-run read-only smoke tests from ChatGPT**

Run:
- `hynoe_status`
- `bloom_server_status`
- `discord_list_channels`

Expected: all succeed through the connected MCP bridge.

- [ ] **Step 4: Run one bounded write test from ChatGPT**

Send one harmless message to the approved Discord test channel.

Expected: message is sent only to the allowlisted channel and appears in audit output without leaking the bot token.

- [ ] **Step 5: Final verification**

Confirm:
- Render service healthy;
- no secrets in source control or logs;
- Discord access remains allowlisted;
- Bloom origin remains `mc.bloom.host`;
- MCP authentication is owner-only;
- ChatGPT can use the intended tools.
