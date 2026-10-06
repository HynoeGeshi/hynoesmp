# Hynoe Control Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a secure ChatGPT plugin/MCP bridge that can read and control the Hynoe SMP Bloom server and approved Discord channels without exposing provider credentials.

**Architecture:** Add a new `control-bridge/` TypeScript app inside `HynoeGeshi/hynoesmp`, but deploy it as a separate Vercel project named `hynoe-control-bridge`. The MCP endpoint uses Streamable HTTP, Supabase OAuth 2.1 for user authentication, narrow Bloom and Discord adapters, centralized policy enforcement, and no destructive v1 tools.

**Tech Stack:** Node.js 20+, TypeScript, Next.js App Router, `mcp-handler` 2.x, `@modelcontextprotocol/server` 2.x, Zod 4, Supabase Auth OAuth 2.1, `@supabase/supabase-js`, `jose`, native `fetch`, `ws`, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-06-hynoe-control-bridge-design.md`

## Global Constraints

- Bloom panel URL is exactly `https://mc.bloom.host`.
- Bloom, Discord, bridge, and Supabase private credentials must never be committed to GitHub, returned by a tool, exposed client-side, or logged.
- Deploy as a separate Vercel project named `hynoe-control-bridge`.
- The MCP endpoint must use Streamable HTTP and a stable HTTPS `/api/mcp` URL.
- Use Supabase OAuth 2.1 with PKCE/DCR for ChatGPT authentication; do not ship a public no-auth write-capable MCP endpoint.
- Only the configured Supabase user may use privileged tools.
- Discord access is channel-allowlisted; no DMs, role management, bans, kicks, or deleting other users' messages in v1.
- Bloom access is server-allowlisted; no server deletion, backup deletion, account/billing changes, arbitrary file deletion, or `kill` power action in v1.
- File reads/writes are text-only, path-allowlisted, and size-limited.
- Tool metadata must correctly mark read-only and destructive behavior.
- Important writes remain subject to ChatGPT/plugin confirmation settings.
- Resolve and pin package versions at implementation time against current official docs, then commit the lockfile.

## Review Focus

1. **OAuth token is valid but belongs to the wrong Supabase user** — reject with 403 before provider calls. Covered in Task 2 auth tests.
2. **Path traversal such as `../../` or encoded traversal** — reject before Bloom file calls. Covered in Task 3 policy tests.
3. **Discord channel ID is not allowlisted** — reject both read and write operations. Covered in Task 5 tests.
4. **Bloom command tries to use blocked host/destructive patterns or power `kill`** — reject locally and do not call Bloom. Covered in Task 4 tests.
5. **Provider error/log payload contains a configured secret** — redact before logging or returning. Covered in Task 2 and Task 6 tests.

---

### Task 1: Scaffold the isolated control-bridge app

**Files:**
- Create: `control-bridge/package.json`
- Create: `control-bridge/package-lock.json`
- Create: `control-bridge/tsconfig.json`
- Create: `control-bridge/next.config.ts`
- Create: `control-bridge/.env.example`
- Create: `control-bridge/.gitignore`
- Create: `control-bridge/src/config.ts`
- Create: `control-bridge/vitest.config.ts`
- Create: `control-bridge/tests/config.test.ts`

**Interfaces:**
- Produces: `loadConfig(env?: NodeJS.ProcessEnv): AppConfig`
- `AppConfig` contains `bloomPanelUrl`, `bloomApiKey`, `bloomServerId`, `discordBotToken`, `discordGuildId`, `discordAllowedChannelIds`, `supabaseUrl`, `supabasePublishableKey`, `allowedSupabaseUserId`, `publicBaseUrl`, `auditLogEnabled`.

- [ ] **Step 1: Write the failing config test**

Test names and assertions:
- `loadConfig_rejects_missing_required_server_secrets`
- `loadConfig_parses_comma_separated_discord_channel_ids`
- `loadConfig_forces_bloom_panel_to_https`

- [ ] **Step 2: Run the config test and verify failure**

Run: `cd control-bridge && npm test -- tests/config.test.ts`
Expected: FAIL because `src/config.ts` does not exist.

- [ ] **Step 3: Scaffold the app and implement `loadConfig()`**

Use Node 20+; install current compatible releases of Next.js, React, TypeScript, `mcp-handler@^2`, `@modelcontextprotocol/server@^2`, `zod@^4`, `@supabase/supabase-js`, `jose`, `ws`, Vitest, and test helpers. Pin resolved versions through `package-lock.json`.

`.env.example` must contain names only, never real values:
`BLOOM_API_KEY`, `BLOOM_SERVER_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_ALLOWED_CHANNEL_IDS`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_SUPABASE_USER_ID`, `PUBLIC_BASE_URL`, `AUDIT_LOG_ENABLED`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- tests/config.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge
git commit -m "feat: scaffold Hynoe control bridge"
```

### Task 2: Add OAuth enforcement, single-user authorization, and secret redaction

**Files:**
- Create: `control-bridge/src/auth/oauth.ts`
- Create: `control-bridge/src/auth/verify-token.ts`
- Create: `control-bridge/src/security/redact.ts`
- Create: `control-bridge/src/app/.well-known/oauth-protected-resource/route.ts`
- Create: `control-bridge/tests/auth.test.ts`
- Create: `control-bridge/tests/redact.test.ts`

**Interfaces:**
- Produces: `verifyMcpAccessToken(request: Request, config: AppConfig): Promise<AuthContext>`
- Produces: `AuthContext = { userId: string; email?: string; scopes: string[] }`
- Produces: `redactSecrets(value: unknown, secrets: string[]): unknown`
- Consumes: `loadConfig()` from Task 1.

- [ ] **Step 1: Write failing auth and redaction tests**

Assertions:
- missing bearer token -> 401-equivalent auth error with MCP OAuth challenge metadata
- expired/invalid token -> rejected
- valid Supabase JWT for wrong `sub` -> rejected with 403
- valid JWT for `ALLOWED_SUPABASE_USER_ID` -> accepted
- output containing exact Bloom or Discord token -> token replaced with `[REDACTED]`

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/auth.test.ts tests/redact.test.ts`
Expected: FAIL because auth/redaction modules do not exist.

- [ ] **Step 3: Implement Supabase OAuth protected-resource discovery and JWT verification**

`/.well-known/oauth-protected-resource` must advertise the Vercel MCP resource and the Supabase Auth issuer. Verify JWT signature from Supabase JWKS with `jose`, plus `iss`, expiry, and `sub`; enforce `sub === ALLOWED_SUPABASE_USER_ID`.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/auth.test.ts tests/redact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/auth control-bridge/src/security control-bridge/src/app/.well-known control-bridge/tests
git commit -m "feat: secure MCP bridge with Supabase OAuth"
```

### Task 3: Add centralized server, channel, command, and file policies

**Files:**
- Create: `control-bridge/src/policy/server-policy.ts`
- Create: `control-bridge/src/policy/discord-policy.ts`
- Create: `control-bridge/src/policy/file-policy.ts`
- Create: `control-bridge/src/policy/command-policy.ts`
- Create: `control-bridge/tests/policy.test.ts`

**Interfaces:**
- Produces: `assertAllowedServer(serverId: string, config: AppConfig): void`
- Produces: `assertAllowedChannel(channelId: string, config: AppConfig): void`
- Produces: `normalizeAllowedFilePath(path: string): string`
- Produces: `assertAllowedCommand(command: string): void`
- Produces: `assertAllowedPowerSignal(signal: "start" | "stop" | "restart"): void`

- [ ] **Step 1: Write failing policy tests**

Assertions:
- only configured Bloom server ID is accepted
- only configured Discord channel IDs are accepted
- `/server.properties`, `/config/...`, `/datapacks/...` normalize and pass
- traversal, null bytes, encoded traversal, `/proc`, `/etc`, and binary extensions fail
- `kill` is never accepted as a power signal
- commands beginning with normal Minecraft commands such as `list`, `say`, `data`, `function`, `scoreboard` are accepted unless denylisted
- obvious shell/host escape patterns are rejected

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/policy.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the policy modules**

File policy: text-only, max path length 512, deny traversal after URL-decoding and POSIX normalization. Command policy must reject multiline/control-character payloads and explicitly deny `stop` if sent through the generic command tool; server stop/restart must go through the power tool.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/policy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/policy control-bridge/tests/policy.test.ts
git commit -m "feat: add bridge authorization policies"
```

### Task 4: Implement the Bloom/Pterodactyl adapter and tools

**Files:**
- Create: `control-bridge/src/bloom/client.ts`
- Create: `control-bridge/src/bloom/types.ts`
- Create: `control-bridge/src/bloom/console.ts`
- Create: `control-bridge/src/tools/bloom.ts`
- Create: `control-bridge/tests/bloom-client.test.ts`
- Create: `control-bridge/tests/bloom-tools.test.ts`

**Interfaces:**
- Produces: `createBloomClient(config: AppConfig): BloomClient`
- `BloomClient` methods: `getServer()`, `getResources()`, `listFiles(path)`, `readFile(path)`, `writeFile(path, content)`, `listBackups()`, `sendCommand(command)`, `setPower(signal)`, `getWebsocketCredentials()`.
- Produces tool handlers: `bloom_server_status`, `bloom_recent_console`, `bloom_send_command`, `bloom_power`, `bloom_list_files`, `bloom_read_file`, `bloom_write_file`, `bloom_list_backups`.

- [ ] **Step 1: Write failing client/tool tests with mocked HTTP/WebSocket**

Assertions:
- requests use `Authorization: Bearer <BLOOM_API_KEY>` and Pterodactyl accept header
- server status combines `/api/client/servers/{id}` and `/resources`
- command posts `{ command }` to `/command`
- power supports only `start|stop|restart`
- file read/write/list endpoints use normalized allowlisted paths
- backup list is metadata-only
- recent console requests websocket credentials, authenticates, requests `send logs`, collects a bounded number of lines, and closes within a fixed timeout
- provider errors are redacted before leaving the adapter

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/bloom-client.test.ts tests/bloom-tools.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the Bloom adapter and handlers**

Use Bloom panel base URL `https://mc.bloom.host` and Pterodactyl Client API routes. `bloom_recent_console` must be best-effort and bounded; if websocket log replay is unavailable, return a clear unsupported/empty result rather than hanging.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/bloom-client.test.ts tests/bloom-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/bloom control-bridge/src/tools/bloom.ts control-bridge/tests/bloom-*.test.ts
git commit -m "feat: add Bloom server controls"
```

### Task 5: Implement the Discord REST adapter and tools

**Files:**
- Create: `control-bridge/src/discord/client.ts`
- Create: `control-bridge/src/discord/types.ts`
- Create: `control-bridge/src/tools/discord.ts`
- Create: `control-bridge/tests/discord-client.test.ts`
- Create: `control-bridge/tests/discord-tools.test.ts`

**Interfaces:**
- Produces: `createDiscordClient(config: AppConfig): DiscordClient`
- `DiscordClient` methods: `listGuildChannels()`, `getRecentMessages(channelId, limit)`, `sendMessage(channelId, content, allowedMentions?)`, `deleteOwnMessage(channelId, messageId)`, `getCurrentBotUser()`.
- Produces tool handlers: `discord_list_channels`, `discord_recent_messages`, `discord_search_recent`, `discord_send_message`, `discord_send_announcement`, `discord_delete_own_message`.

- [ ] **Step 1: Write failing Discord tests**

Assertions:
- every REST request uses `Authorization: Bot <DISCORD_BOT_TOKEN>`
- channels returned are intersected with the configured allowlist
- reads from unallowlisted channels fail locally
- message count is capped at 100 per REST call and tool-level default is 25
- sends default to `allowed_mentions.parse = []`
- `@everyone`/`@here` is blocked unless explicit `allowMassMention=true`
- delete operation verifies the target message author matches the bot user before deletion

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/discord-client.test.ts tests/discord-tools.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the Discord REST adapter and handlers**

Use Discord REST API only in v1; do not run a persistent Gateway websocket. Message content reading depends on the bot/app configuration and Discord intent rules; surface a clear configuration error when content is unavailable.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/discord-client.test.ts tests/discord-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/discord control-bridge/src/tools/discord.ts control-bridge/tests/discord-*.test.ts
git commit -m "feat: add Discord bridge tools"
```

### Task 6: Register the MCP server, annotations, health checks, and audit logging

**Files:**
- Create: `control-bridge/src/mcp/server.ts`
- Create: `control-bridge/src/app/api/mcp/route.ts`
- Create: `control-bridge/src/app/api/health/route.ts`
- Create: `control-bridge/src/audit/logger.ts`
- Create: `control-bridge/tests/mcp.test.ts`
- Create: `control-bridge/tests/audit.test.ts`

**Interfaces:**
- Produces: `createHynoeMcpServer(config: AppConfig)`
- Produces: `writeAuditEvent(event: AuditEvent): Promise<void>`
- MCP route consumes `verifyMcpAccessToken()` before executing provider tools.

- [ ] **Step 1: Write failing MCP/audit tests**

Assertions:
- unauthenticated `/api/mcp` tool execution is rejected with OAuth challenge metadata
- tool list exposes only v1 approved tools
- status/list/read tools have `readOnlyHint: true`
- write/send/power/file-write tools have write annotations; no tool is marked non-destructive if it changes state
- no delete-server, delete-backup, ban, kick, role-management, DM-read, or arbitrary-delete tool exists
- audit entries contain timestamp/tool/target/result but never raw provider tokens or full private message bodies

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/mcp.test.ts tests/audit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement MCP registration, `/api/mcp`, `/api/health`, and audit logging**

Use `mcp-handler` 2.x + MCP SDK v2 registration APIs and Zod 4 schemas. `/api/health` returns only non-secret readiness flags (`mcp`, `bloomConfigured`, `discordConfigured`, `oauthConfigured`).

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/mcp.test.ts tests/audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/mcp control-bridge/src/app/api control-bridge/src/audit control-bridge/tests/mcp.test.ts control-bridge/tests/audit.test.ts
git commit -m "feat: expose secure Hynoe MCP server"
```

### Task 7: Add Supabase consent/login UI and end-to-end OAuth configuration

**Files:**
- Create: `control-bridge/src/app/login/page.tsx`
- Create: `control-bridge/src/app/oauth/consent/page.tsx`
- Create: `control-bridge/src/supabase/browser.ts`
- Create: `control-bridge/src/supabase/server.ts`
- Create: `control-bridge/tests/oauth-ui.test.tsx`
- Modify: `control-bridge/.env.example`

**Interfaces:**
- Produces a Supabase sign-in page and OAuth consent page compatible with Supabase OAuth 2.1 server authorization requests.
- Consent page calls Supabase `getAuthorizationDetails()`, then `approveAuthorization()` or `denyAuthorization()`.

- [ ] **Step 1: Write failing OAuth UI tests**

Assertions:
- missing `authorization_id` shows a safe error and never approves
- unauthenticated visitor is routed to sign-in while preserving `authorization_id`
- consent page displays requesting client + scopes
- approve/deny actions call the matching Supabase OAuth API exactly once

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/oauth-ui.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement login and consent routes**

Use Supabase OAuth 2.1 server with PKCE and Dynamic Client Registration enabled. Keep authorization UI minimal because only the owner will use it initially.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/oauth-ui.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-bridge/src/app/login control-bridge/src/app/oauth control-bridge/src/supabase control-bridge/tests/oauth-ui.test.tsx control-bridge/.env.example
git commit -m "feat: add OAuth consent flow"
```

### Task 8: Full security verification and production deployment

**Files:**
- Create: `control-bridge/README.md`
- Create: `control-bridge/tests/security.integration.test.ts`
- Modify only if needed: previous `control-bridge/src/**` files to fix test findings.

**Interfaces:**
- Consumes all prior tasks.
- Produces the production Vercel MCP endpoint and setup documentation.

- [ ] **Step 1: Write the security integration test**

Assertions:
- wrong user cannot reach Bloom/Discord adapters
- traversal cannot reach Bloom
- unallowlisted Discord channel cannot be read or written
- `kill` cannot reach Bloom
- known secrets never occur in serialized errors or audit records
- health route exposes no secrets

- [ ] **Step 2: Run the entire suite before deployment**

Run: `npm test && npm run typecheck && npm run build`
Expected: all PASS; build succeeds.

- [ ] **Step 3: Create the separate Vercel project**

Project name: `hynoe-control-bridge`.
Root directory: `control-bridge`.
Do not reuse the public website deployment.

- [ ] **Step 4: Configure non-secret Vercel values**

Set `BLOOM_PANEL_URL=https://mc.bloom.host`, plus `BLOOM_SERVER_ID`, `DISCORD_GUILD_ID`, `DISCORD_ALLOWED_CHANNEL_IDS`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_SUPABASE_USER_ID`, `PUBLIC_BASE_URL`, `AUDIT_LOG_ENABLED=true`.

- [ ] **Step 5: User adds provider secrets in protected Vercel fields**

User-only credentials:
- `BLOOM_API_KEY`
- `DISCORD_BOT_TOKEN`

Do not paste either into chat or GitHub.

- [ ] **Step 6: Configure Supabase OAuth 2.1**

Enable OAuth server and DCR, configure authorization path `/oauth/consent`, ensure asymmetric JWT signing keys are active, create/sign in to the owner account, and set `ALLOWED_SUPABASE_USER_ID` to that account's immutable user ID.

- [ ] **Step 7: Deploy and smoke-test production**

Verify:
- `GET /api/health` returns 200 with non-secret readiness
- OAuth discovery endpoint returns valid metadata
- MCP Inspector can complete OAuth and list tools
- `bloom_server_status` works
- `discord_list_channels` shows only allowlisted channels
- test send goes to the chosen Discord test channel
- harmless `list` command reaches Minecraft console

- [ ] **Step 8: Connect to ChatGPT as a personal plugin**

Use ChatGPT Plugins -> Add custom MCP server, point it to `https://<production-domain>/api/mcp`, select OAuth, complete the Supabase login/consent flow, create/install the plugin, and refresh its tool list after deployment changes. Current OpenAI docs state custom MCP plugins can expose read and write tools subject to permission confirmations.

- [ ] **Step 9: Final production verification**

From ChatGPT, verify these user goals end to end:
1. “What is my Hynoe SMP server status?”
2. “Who/what does the console say is online?” or `list` via console command.
3. “Read the latest messages in the approved Discord test channel.”
4. “Send ‘Hynoe bridge test ✅’ to the approved Discord test channel.”
5. Request a restart and confirm the write approval path appears before execution.

- [ ] **Step 10: Commit deployment docs**

```bash
git add control-bridge/README.md control-bridge/tests/security.integration.test.ts control-bridge/src
git commit -m "docs: finalize Hynoe control bridge deployment"
```

## Self-Review Notes

- **Spec coverage:** All Bloom, Discord, MCP, auth, safety, health, audit, deployment, and user-only credential steps are represented.
- **Deliberate implementation refinement:** The approved spec preferred a Site-hosted plugin because Plus MCP availability was uncertain. Current OpenAI documentation now explicitly describes creating a personal plugin directly from a custom MCP server with read/write tools; this plan uses that direct path first and keeps the Site-hosted path as a fallback if the account UI lacks “Add custom MCP server.”
- **Type consistency:** `AppConfig`, `AuthContext`, `BloomClient`, and `DiscordClient` are defined once and consumed by later tasks under the same names.
- **Security:** Supabase Auth is the OAuth authorization server; the bridge remains the protected MCP resource server and separately holds Bloom/Discord credentials.
- **Scope:** No persistent Discord Gateway worker, Minecraft-to-Discord event bridge, destructive host actions, or multi-user admin features are included in v1.
