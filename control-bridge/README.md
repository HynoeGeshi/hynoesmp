# Hynoe Control Bridge

Private, owner-authorized MCP bridge for Hynoe SMP on Bloom.host and the Hynoe Discord community.

## What it exposes

### Bloom.host
- Server state and resource usage
- Bounded recent console replay
- Guarded Minecraft console commands
- Start / stop / restart power controls
- Approved configuration-file listing, reading, and writing
- Backup metadata listing

### Discord
- Guild-wide category/channel inventory and bounded recent-message search
- Roles, permission-overwrite, onboarding, and webhook inspection
- Aggregate channel-activity summaries without member profiling
- Routine message and announcement posting
- Reversible channel/category creation, rename/move/reorder, and topic changes
- Low-risk role creation/update/reorder
- Channel-permission updates with runtime detection of access broadening
- Confirmation-gated moderation and destructive operations

The bridge does **not** automate a normal Discord user account, use a self-bot, expose Discord DMs, transfer guild ownership, manage Discord billing, delete Bloom servers/backups, or provide arbitrary filesystem deletion.

## Discord safety model

Routine reversible organization changes may run after the owner authorizes the bridge. The following require explicit confirmation before the provider call can occur:

- kick, ban, unban, or timeout
- destructive channel/category deletion
- destructive role deletion
- bulk deletion of member-authored messages
- mass member-role changes
- permission changes that materially broaden access
- webhook/integration removal

The bridge also:

- blocks Discord mass mentions by default
- keeps message/activity analysis bounded
- logs management metadata without storing message bodies, passwords, auth headers, tokens, or provider secrets
- does not automatically retry failed Discord writes
- relies on Discord's role hierarchy and API permission enforcement instead of bypassing it

## Environment variables

Store real values only in the Render environment-variable store. Never commit credentials.

```text
BLOOM_API_KEY=
BLOOM_SERVER_ID=
BLOOM_PANEL_URL=https://mc.bloom.host
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_GUILD_MANAGEMENT_ENABLED=false
DISCORD_ALLOWED_CHANNEL_IDS=
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ALLOWED_SUPABASE_USER_ID=
PUBLIC_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com
AUDIT_LOG_ENABLED=true
```

Set `DISCORD_GUILD_MANAGEMENT_ENABLED=true` on Render for the approved guild-wide Hynoe Discord management mode. In that mode, the configured guild is the boundary and `DISCORD_ALLOWED_CHANNEL_IDS` is optional. Leave guild management disabled when using the legacy channel-allowlist mode; then at least one channel ID is required.

## Bloom setup

1. Sign in to Bloom's panel at `mc.bloom.host`.
2. Open **Account API** and create an API key for the account that can access Hynoe SMP.
3. Store it directly in Render as `BLOOM_API_KEY`; never paste it into ChatGPT, Discord, or GitHub.
4. Set `BLOOM_SERVER_ID` to the Hynoe SMP server identifier shown by the Bloom/Pterodactyl panel.

The bridge locks `BLOOM_PANEL_URL` to `https://mc.bloom.host`.

## Discord bot setup

Create a dedicated Discord application/bot. Do **not** use a normal user token or self-bot.

Grant only the granular permissions needed by the approved management scope:

- View Channels
- Read Message History
- Send Messages
- Embed Links
- Manage Channels
- Manage Roles
- Manage Messages
- View Audit Log
- Manage Webhooks only if approved integrations need it
- Manage Guild only if a supported onboarding/server-setting operation requires it

Do **not** grant `Administrator` by default. Put the Hynoe Control bot role above only the roles it must manage and below owner/critical roles.

Enable the **Message Content** privileged intent because bounded message reading/search and activity analysis use message bodies. Keep Presence and Guild Members privileged intents disabled unless a later approved feature specifically requires them.

Store the bot token as `DISCORD_BOT_TOKEN` and the Hynoe guild ID as `DISCORD_GUILD_ID` in Render.

## Supabase owner authorization

The bridge uses Supabase OAuth 2.1 and accepts MCP access only from the configured owner account.

1. Enable Supabase OAuth 2.1 Server for the bridge project.
2. Enable the client-registration mode required by the ChatGPT MCP connection.
3. Configure the consent UI as `https://YOUR_RENDER_SERVICE.onrender.com/oauth/consent`.
4. Create/sign in to the intended owner account.
5. Store that account's Supabase UUID in Render as `ALLOWED_SUPABASE_USER_ID`.
6. Store `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Render.

The bridge verifies Supabase JWT signatures/issuer and requires the exact configured owner subject.

## Endpoints

- MCP: `/api/mcp`
- OAuth protected-resource metadata: `/.well-known/oauth-protected-resource`
- OAuth consent UI: `/oauth/consent?authorization_id=...`
- Owner login: `/login?authorization_id=...`
- Health: `/health`

## Development and verification

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The Render service uses the same test → typecheck → production-build gate before deployment.

Recommended live verification order:

1. `hynoe_status`
2. `discord_guild_overview`
3. `discord_list_roles`
4. `discord_list_webhooks`
5. `discord_activity_summary`
6. one reversible low-risk Discord channel update/create operation
7. verify a high-impact operation cannot execute without explicit confirmation
8. Bloom status/console verification

Do not begin a live Discord overhaul by deleting the old structure. Inventory first, preserve useful channel history by renaming/moving where practical, validate permissions, and only then request confirmation for any destructive cleanup.
