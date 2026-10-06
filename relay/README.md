# Hynoe community backend

This Cloudflare Worker powers **Hynoe Global Chat** for `hynoesmp.com` and Hynoe Outpost. It is site-native only: there is no Minecraft, Bloom, Discord, or YouTube relay path.

## Activation

1. Create a Cloudflare Turnstile widget for `hynoesmp.com` and `www.hynoesmp.com`.
2. Deploy this directory with Wrangler.
3. Configure private Worker secrets with `npx wrangler secret put NAME` for:
   - `TURNSTILE_SECRET`
   - `IP_SALT`
   - `ADMIN_TOKEN`
   - `SESSION_SECRET` (used by guest sessions in the next implementation stage)
4. Keep `CHAT_ENABLED=false` until the deployed Worker and moderation console are tested.
5. Put only public values in `data/chat-config.json`: the deployed HTTPS community endpoint and public Turnstile site key.

No private secret belongs in GitHub Pages, browser JavaScript, screenshots, logs, or the public JSON config.

## Current moderation and limits

- Allowed origins are restricted to the Hynoe site.
- Request bodies are size-limited and invalid JSON is rejected.
- Public chat rejects commands, control/format characters, and links.
- Staff/system-like guest names are blocked.
- Ordinary profanity is censored before storage.
- Severe abuse patterns, slurs, threat/self-harm abuse, obvious doxxing, sexual-minor content, and common phishing/scam patterns are hard-blocked before publication.
- Rate limits use a salted ephemeral IP hash. Raw IP addresses are not stored in application state.
- Messages are capped at 100 recent records and retained for at most 24 hours.
- Reports are retained for the moderation window.
- Admin can pause, delete, and mute through bearer-token protected endpoints.
- Public message responses exclude moderation-only metadata and visitor hashes.

These controls reduce abuse but do not replace human moderation.

## Checks

From the repository root run:

```bash
node --test tests/*.test.mjs
```

Browser tests and the live Turnstile/Worker integration must also pass before enabling chat in production.
