# Hynoe Control Bridge — Design Specification

Date: 2026-10-06
Owner: Hynoe / Terrell Stewart
Status: Approved design, implementation pending

## 1. Goal

Create a secure control bridge that lets Hynoe use ChatGPT to inspect and manage the Hynoe SMP Bloom.host server and selected Discord server functions without sharing Bloom or Discord passwords in chat.

The bridge must support both read actions and selected write actions while keeping credentials server-side, applying least-privilege controls, logging important actions, and requiring confirmation for destructive operations.

## 2. User Experience

After setup, the user should be able to ask ChatGPT things such as:

- “Is the Hynoe SMP server online and what are CPU/RAM usage right now?”
- “Show me recent console errors.”
- “Who is online?”
- “Run `/say Server restart in 5 minutes`.”
- “Restart the server.”
- “Read the last 25 messages in #server-chat.”
- “Post this announcement in #announcements.”
- “Show me the latest Discord messages about campaign bugs.”

The user should not need to keep their PC on for these actions.

## 3. High-Level Architecture

Primary components:

1. **Hynoe Control Bridge** — private server-side application deployed separately from the public Hynoe SMP website.
2. **Bloom/Pterodactyl client** — authenticated against Bloom’s Pterodactyl-compatible Account API at `https://mc.bloom.host`.
3. **Discord bot client** — authenticated with a dedicated Discord bot token, not a user account.
4. **MCP/tool layer** — exposes narrowly scoped tools for Bloom and Discord.
5. **ChatGPT plugin/Site connection** — the ChatGPT-facing integration layer. For a Plus account, prefer a Site-hosted plugin or other plugin path available to the account; do not depend on Business/Enterprise-only full custom-MCP features.

Logical flow:

`ChatGPT -> Hynoe plugin/Site -> Hynoe Control Bridge -> Bloom API / Discord API`

## 4. Hosting

Use Vercel for the bridge because the user already has a connected Vercel account and it supports remote MCP servers over Streamable HTTP.

Create a separate Vercel project named:

`hynoe-control-bridge`

Do not place Bloom or Discord credentials in the public Hynoe SMP website repository, client-side JavaScript, GitHub commits, build logs, or browser storage.

## 5. Authentication and Secrets

Required secrets:

- `BLOOM_API_KEY`
- `DISCORD_BOT_TOKEN`
- `BRIDGE_AUTH_SECRET`

Non-secret configuration:

- `BLOOM_PANEL_URL=https://mc.bloom.host`
- `BLOOM_SERVER_ID` or server UUID/identifier
- `DISCORD_APPLICATION_ID`
- `DISCORD_GUILD_ID`
- permitted Discord channel IDs

Secrets must be stored only in protected server-side environment variables or an equivalent encrypted secret store.

The bridge must never return secret values from a tool call, log them, expose them through diagnostics, or place them in exception messages.

## 6. Bloom Integration

Use Bloom’s Pterodactyl-compatible client API.

Initial Bloom tool set:

### Read-only

- `bloom_server_status`
  - server online/offline state
  - CPU usage
  - RAM usage
  - disk usage where available
  - uptime where available

- `bloom_list_servers`
  - only servers visible to the configured API key

- `bloom_recent_console`
  - recent console output/errors if exposed by the supported API path or bridge transport
  - redact secrets and known credentials

- `bloom_list_files`
  - restrict to approved paths

- `bloom_read_file`
  - restrict to text/config files and approved server directories
  - enforce size limits

- `bloom_list_backups`
  - metadata only by default

### Write

- `bloom_send_command`
  - send Minecraft console commands
  - deny dangerous host/shell-style payloads
  - maintain an allow/deny policy

- `bloom_power`
  - allowed values: start, stop, restart
  - confirmation required for stop/restart unless explicitly relaxed later

- `bloom_write_file`
  - only approved server paths
  - create a backup/snapshot where practical before modifying important configuration
  - no binary upload in v1

### Excluded from v1

- deleting the server
- deleting backups
- changing account ownership
- changing billing
- exposing API credentials
- arbitrary unrestricted filesystem deletion

## 7. Discord Integration

Use a dedicated Discord application/bot. Do not automate the user’s normal Discord account or use a self-bot.

Required bot permissions should be minimized to the chosen channels. Likely permissions:

- View Channels
- Read Message History
- Send Messages
- Embed Links if desired
- Attach Files only if later needed

Do not grant Administrator unless there is a future capability that truly requires it.

Enable the Message Content privileged intent only if reading message bodies is required by the chosen Discord workflow. Keep Presence and Guild Members intents disabled unless a feature explicitly requires them.

Initial Discord tool set:

### Read-only

- `discord_list_channels`
  - return only channels the bot can access

- `discord_recent_messages`
  - channel allowlist enforced
  - configurable count cap

- `discord_search_recent`
  - search over a bounded recent-message window
  - no broad server-wide scraping by default

### Write

- `discord_send_message`
  - allowlisted channels only
  - no mass mentions by default

- `discord_send_announcement`
  - optional structured announcement helper
  - block `@everyone` / `@here` unless the tool invocation explicitly requests and approval is granted

- `discord_delete_own_message`
  - bot-authored messages only in v1

### Excluded from v1

- banning/kicking members
- role management
- deleting other users’ messages
- reading DMs
- reading channels outside the allowlist
- impersonating the user

## 8. Safety Controls

Every tool must be classified as one of:

- safe read
- low-risk write
- important write
- destructive/high-risk

Default policy:

- safe reads can run without extra confirmation once the plugin is connected
- low-risk writes can follow ChatGPT/plugin permission controls
- restart/stop, config writes, broad announcements, and similar actions require confirmation
- destructive actions are unavailable in v1

Additional controls:

- channel allowlists
- server identifier allowlist
- file-path allowlist
- command denylist
- payload size limits
- rate limiting
- audit log with timestamp, tool, target, success/failure, and non-secret parameters
- secrets redaction
- strict CORS/origin policy where applicable
- no client-side secrets
- no secret values committed to GitHub

## 9. MCP / Plugin Interface

The bridge should expose small, typed tools rather than one unrestricted “execute anything” endpoint.

Suggested MCP tools:

- `hynoe_status`
- `bloom_server_status`
- `bloom_recent_console`
- `bloom_send_command`
- `bloom_power`
- `bloom_list_files`
- `bloom_read_file`
- `bloom_write_file`
- `bloom_list_backups`
- `discord_list_channels`
- `discord_recent_messages`
- `discord_search_recent`
- `discord_send_message`
- `discord_send_announcement`
- `discord_delete_own_message`

Tool responses should be concise, structured JSON with human-readable summaries where useful.

## 10. ChatGPT Plus Connection Strategy

Because the user is on ChatGPT Plus, the implementation must not assume Business/Enterprise-only full custom-MCP write support.

Preferred path:

1. Deploy the remote Hynoe Control Bridge.
2. Create or use a ChatGPT Site that exposes/connects the bridge tools.
3. Publish the Site to create its associated personal plugin.
4. Install the plugin in the user’s ChatGPT account.
5. Connect the plugin and test read actions first.
6. Test low-risk Discord/Bloom writes.
7. Keep important write approvals enabled.

Fallback path:

- If Site-hosted plugin functionality is not present on the user’s account yet, keep the bridge deployed and usable through its secure test UI/API, then connect it through the first supported plugin/MCP surface that becomes available to the account.

## 11. Runtime Model

Vercel serverless functions are suitable for on-demand REST calls to Bloom and Discord.

The v1 bridge will not keep a permanent Discord Gateway websocket open. That means:

- on-demand reading and posting works
- real-time “watch every Discord message continuously” is out of scope for v1

For future real-time Minecraft <-> Discord chat bridging, use either:

- a server-side Minecraft mod/plugin that pushes events to the bridge/Discord webhook, or
- a persistent worker service designed for Discord Gateway connections

This avoids pretending a serverless function is an always-on Discord bot process.

## 12. Observability

Add:

- `/health` endpoint
- connection status for Bloom and Discord without exposing credentials
- structured error logs
- redaction middleware
- optional basic action audit endpoint protected by bridge authentication

## 13. Testing

Before enabling writes:

1. Verify health endpoint.
2. Verify Bloom server list/status.
3. Verify Discord bot can see only intended channels.
4. Read recent Discord messages from an approved test channel.
5. Send a test Discord message to an approved test channel.
6. Run a harmless Minecraft console command such as `list`.
7. Confirm server restart requires approval.
8. Confirm blocked file paths cannot be read/written.
9. Confirm secrets never appear in logs or responses.
10. Confirm public requests without bridge authentication are rejected.

## 14. Deployment Deliverables

Implementation should produce:

- separate `hynoe-control-bridge` Vercel project
- working remote MCP/tool endpoint
- Bloom client
- Discord client
- environment variable placeholders
- least-privilege tool policies
- health/status endpoint
- tests for auth, path/channel restrictions, and redaction
- setup instructions for Bloom API key creation
- setup instructions for Discord bot creation/invite
- ChatGPT Site/plugin connection instructions

## 15. User-Only Setup Steps

The assistant can build and deploy the bridge, but the user must personally complete provider authorization steps that expose credentials.

The user will need to:

1. Create a Bloom Account API key in the Bloom panel and place it in the protected Vercel environment variable field.
2. Create a Discord application/bot, enable only the required intent(s), invite it to the Hynoe Discord, and place the bot token in the protected Vercel environment variable field.
3. Install/authorize the resulting ChatGPT plugin when the ChatGPT UI prompts for it.

Passwords are never required.

## 16. Definition of Done

The connection is complete when:

- ChatGPT can retrieve Bloom server status and recent server information through the installed Hynoe plugin.
- ChatGPT can read messages from approved Discord channels.
- ChatGPT can send a test Discord message.
- ChatGPT can send a harmless Minecraft console command.
- important write operations require approval.
- no Bloom API key, Discord bot token, or bridge secret is exposed to the browser, repository, logs, or chat.
