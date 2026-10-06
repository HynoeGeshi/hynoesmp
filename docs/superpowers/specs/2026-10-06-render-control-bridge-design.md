# Hynoe Control Bridge — Render Deployment Design

## Goal
Deploy the existing `control-bridge` application from `HynoeGeshi/hynoesmp` on Render so ChatGPT can reach the private Hynoe MCP bridge without depending on the currently broken Hynoe-team Vercel API authorization.

## Source
- Repository: `HynoeGeshi/hynoesmp`
- Branch: `feature/hynoe-control-bridge`
- Application directory: `control-bridge`
- Runtime: Node.js 22+
- Build command: `cd control-bridge && npm ci && npm run build`
- Start command: `cd control-bridge && npm start`

## Render Configuration
- Service name: `hynoe-control-bridge`
- Service type: Web Service
- Region: Ohio (closest Render region to the primary Chicago-area operator)
- Initial plan: Free, to avoid incurring paid hosting charges without explicit approval
- Auto-deploy: disabled until the first verified deployment is healthy; can be enabled after validation

## Required Environment Variables
The existing bridge intentionally fails closed if required configuration is absent. Render must receive these before the verified production deployment:

- `BLOOM_API_KEY` — secret
- `BLOOM_SERVER_ID`
- `BLOOM_PANEL_URL=https://mc.bloom.host`
- `DISCORD_BOT_TOKEN` — secret
- `DISCORD_GUILD_ID`
- `DISCORD_ALLOWED_CHANNEL_IDS` — comma-separated allowlist
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `ALLOWED_SUPABASE_USER_ID`
- `PUBLIC_BASE_URL` — Render service HTTPS origin
- `AUDIT_LOG_ENABLED=true`

No secrets are committed to GitHub. Secrets are stored only in the hosting environment.

## Security Requirements
The deployment must preserve the bridge's existing Discord restrictions:
- dedicated Discord bot token only; no user/self-bot token
- explicit guild and channel allowlist
- no Administrator permission
- only View Channels, Read Message History, Send Messages, and optional Embed Links
- mass mentions remain blocked unless explicitly approved
- deletion remains limited to messages authored by the bot
- credentials stay server-side and are not logged

Bloom access remains locked to `https://mc.bloom.host`. Supabase OAuth remains the owner-authentication layer for the MCP endpoint.

## Deployment Sequence
1. Create the Render web service from the feature branch using the commands above.
2. Obtain the generated Render HTTPS service origin.
3. Set all required environment variables, including `PUBLIC_BASE_URL` to that origin.
4. Deploy once configuration is complete.
5. Verify `/health`.
6. Verify MCP endpoint `/api/mcp` and protected-resource metadata.
7. Test in this order: `hynoe_status`, `bloom_server_status`, `discord_list_channels`, bounded Discord read, Discord send in an approved test channel, Bloom `list` command.
8. Only after the above passes, connect the deployed MCP endpoint to ChatGPT and enable auto-deploy if desired.

## Failure Handling
- Missing configuration: do not loosen validation or insert placeholder production secrets.
- Build failure: inspect Render build logs and fix the source/commands rather than bypassing checks.
- Discord authorization failure: verify bot installation, Message Content intent, guild ID, channel IDs, and minimal permissions.
- OAuth failure: verify the Supabase OAuth server configuration and exact Render base URL before changing bridge authentication code.

## Success Criteria
The bridge is considered ready when Render reports a healthy deployment, `/health` succeeds, authenticated MCP discovery works, Discord operations are restricted to the approved channels, Bloom read/status succeeds, and no credentials appear in source control or logs.
