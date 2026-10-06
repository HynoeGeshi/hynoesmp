# Hynoe Control Bridge

Private MCP bridge that exposes a tightly scoped set of Bloom.host Minecraft and Discord bot tools to ChatGPT.

## What it exposes

### Bloom.host
- Server state and resource usage
- Recent console replay (bounded)
- Guarded Minecraft console commands
- Start / stop / restart power controls
- Approved configuration-file listing, reading, and writing
- Backup metadata listing

### Discord
- Approved channel listing
- Bounded recent-message reads and search
- Bot message / announcement sending
- Deletion of bot-authored messages only

The bridge intentionally does **not** expose server deletion, backup deletion, billing/account management, arbitrary filesystem deletion, Discord DMs, member moderation, role management, or user-account automation.

## Security model

- Bloom and Discord credentials are server-only environment variables.
- Bloom access is restricted to one configured server identifier.
- Discord access is restricted to an explicit channel allowlist.
- File access is restricted to approved config/datapack/plugin text paths and rejects traversal/double-encoding.
- Console commands block server power commands and shell-like payloads; power changes use a separate typed tool.
- Discord mass mentions are disabled unless explicitly requested.
- OAuth JWTs are verified against Supabase JWKS and restricted to one configured Supabase user ID.
- Provider errors and audit logs redact Bloom and Discord credentials.
- MCP annotations mark read-only vs write vs destructive actions so clients can apply review controls.

## Environment variables

Copy `.env.example` and configure these only in the deployment secret store:

```text
BLOOM_API_KEY=
BLOOM_SERVER_ID=
BLOOM_PANEL_URL=https://mc.bloom.host
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_ALLOWED_CHANNEL_IDS=123,456
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ALLOWED_SUPABASE_USER_ID=
PUBLIC_BASE_URL=https://YOUR_DEPLOYMENT_DOMAIN
AUDIT_LOG_ENABLED=true
```

Never commit real values.

## Bloom setup

1. Sign in to Bloom's panel at `mc.bloom.host`.
2. Open **Account API** and create an API key for the account that can access Hynoe SMP.
3. Store it as `BLOOM_API_KEY` in Vercel; do not paste it into ChatGPT, Discord, or GitHub.
4. Set `BLOOM_SERVER_ID` to the Hynoe SMP server identifier shown by the Pterodactyl/Bloom panel.

The bridge defaults to `https://mc.bloom.host` and rejects a different Bloom hostname.

## Discord setup

Create a dedicated Discord application/bot. Do **not** use a normal user token or self-bot.

Recommended guild permissions are limited to the selected channels:
- View Channels
- Read Message History
- Send Messages
- Embed Links if desired

Enable the **Message Content** privileged intent because this bridge reads message bodies. Administrator is not needed.

Store the bot token as `DISCORD_BOT_TOKEN`, the guild ID as `DISCORD_GUILD_ID`, and comma-separated approved channel IDs as `DISCORD_ALLOWED_CHANNEL_IDS`.

## Supabase OAuth setup

The bridge uses Supabase's OAuth 2.1 server as the authorization server.

1. Use a dedicated Supabase project for this bridge, or intentionally configure an existing project after checking its other auth consumers.
2. Enable Supabase OAuth 2.1 Server.
3. Enable the client-registration mode required by your MCP/ChatGPT connection.
4. Configure the authorization/consent UI URL to:
   `https://YOUR_DEPLOYMENT_DOMAIN/oauth/consent`
5. Sign into the bridge owner account and set its Supabase user UUID as `ALLOWED_SUPABASE_USER_ID`.
6. Put the project URL and publishable key into `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Supabase currently supports standard scopes such as `openid` and `email`; the bridge uses those and enforces action risk internally with allowlists and MCP annotations.

## Endpoints

- MCP: `/api/mcp`
- OAuth protected-resource metadata: `/.well-known/oauth-protected-resource`
- OAuth consent UI: `/oauth/consent?authorization_id=...`
- Owner login: `/login?authorization_id=...`
- Health: `/health`

## Development

```bash
npm ci
npm test
npm run typecheck
npm run build
```

For local builds, all required environment variables must be present because MCP and auth configuration are validated on startup.

## Connecting ChatGPT

Once the production deployment and Supabase OAuth server are configured, add the deployed `/api/mcp` URL through the ChatGPT custom MCP/plugin connection surface available to the account. Complete the one-time owner login and explicit consent screen when prompted.

Test in this order:
1. `hynoe_status`
2. `bloom_server_status`
3. `discord_list_channels`
4. `discord_recent_messages` in a test channel
5. `discord_send_message` to a test channel
6. `bloom_send_command` with `list`
7. Verify stop/restart and config writes receive the expected important-action review.
