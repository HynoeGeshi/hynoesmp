# Hynoe viewer chat relay

This Worker takes website chat to the existing Bloom Minecraft server using the panel's client API. The only generated Minecraft command is `tellraw @a` with JSON-escaped plain text. Neither browsers nor visitors receive an API key or arbitrary command access. The feed is **website → Minecraft**, not a Minecraft log mirror and not YouTube chat synchronization. A successful panel response means console acceptance, not verified in-game rendering.

## Activation — owner access required

1. In Cloudflare, create a Turnstile widget for `hynoesmp.com` and `www.hynoesmp.com`. Keep its secret private. Cloudflare Workers with a SQLite Durable Object can start on the free plan, subject to its request/storage limits. No paid plan is required by this code.
2. From this directory, use the official Wrangler CLI (`npx wrangler login`, then `npx wrangler deploy`). Configure private secrets with `npx wrangler secret put NAME`: `BLOOM_API_KEY`, `TURNSTILE_SECRET`, `IP_SALT`, `ADMIN_TOKEN`. Generate two distinct long random values for the last two. Do not put them in the website or Git. Prefer a dedicated Bloom subuser with only console command permission for Hynoe's server. Never reuse an exposed key.
3. Confirm that `BLOOM_SERVER_ID` in `wrangler.toml` is this server. It is currently the known identifier `75621d38`. The panel hostname is fixed to `mc.bloom.host`.
4. Set `data/chat-config.json` in the website to the deployed HTTPS Worker URL and the **public** Turnstile site key. Publish those two public values with the website.
5. Set `CHAT_ENABLED` to `true`, deploy, and send an owner test from the website while watching Minecraft. Verify the gold `[WEB GUEST]` prefix, display, and cooldown. No server restart/mod installation should be required, but real delivery is untested until this step succeeds. Pause again if testing fails.
6. Open `chat-admin.html`, enter the Worker URL and admin token. The token stays in page memory only. Verify remove/mute/pause, then leave chat enabled for viewers. The admin page must be served from an allowed site origin.

The static website stays fully usable while unconfigured; chat visibly remains offline. The mining game works independently. No Minecraft rewards, balances, or campaign states are changed.

## Moderation and limits

- Public warning + mandatory consent; unverified guest badge; reserved staff words blocked.
- Turnstile server verification and hostname check on both send and report; single-use tokens.
- Per-IP (daily salted hash) cooldown 15 seconds and 120 requests/hour; global message spacing 3 seconds. State reservations use durable transactions.
- 240 characters; no line breaks/control codes/format codes/commands or common links. Safe JSON command construction; DOM messages use textContent.
- These controls do not guarantee clean language. Moderator presence is still needed. There is no claim of automatic hate/profanity detection.
- Admin can pause the relay, remove website posts and mute the daily visitor IP hash. Mutes expire at the next UTC hash rotation at the latest; VPN/network changes can bypass anonymous mutes. Prefer verified accounts if stronger identity is needed.
- A removed message cannot be retracted from Minecraft, YouTube recordings, or a stream already broadcast. User notices make stream visibility clear.
- The feed keeps at most 100 accepted messages for 24 hours; at most 500 reports for 24 hours. An hourly alarm removes expired records even without visits. Anti-spam state expires after 24 hours and is removed on the next alarm (up to one extra hour). Raw IP addresses are sent only to Turnstile verification, not saved by this application. Cloudflare/Bloom have their own processing policies.
- A failed/uncertain send is never marked delivered or automatically retried. Users are told if delivery is uncertain.

## Checks

Run `node --test tests/*.test.mjs` from the repository root. Those tests use mocked network and storage and do not send real chat. Test the actual Turnstile/Worker/Bloom integration before calling it live.

References: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ ; https://developers.cloudflare.com/durable-objects/ ; https://github.com/pterodactyl/panel
