# Hynoe Global Chat backend

This Cloudflare Worker powers the Hynoe website and Hynoe Outpost community chat. It is intentionally site-only: public chat is never relayed to Minecraft, Discord, YouTube, or any hosting-panel console.

## Activation

1. Create a Cloudflare Turnstile widget for `hynoesmp.com` and `www.hynoesmp.com`.
2. Deploy this directory with Wrangler.
3. Configure private Worker secrets with `npx wrangler secret put NAME` for `TURNSTILE_SECRET`, `IP_SALT`, `SESSION_SECRET`, and `ADMIN_TOKEN`. Use distinct long random values and never commit them.
4. Put only the deployed HTTPS community endpoint and the public Turnstile site key in `data/chat-config.json`.
5. Keep `CHAT_ENABLED = "false"` until the deployed endpoint is verified, then switch it on and test with two independent browser sessions.
6. Use `chat-admin.html` for pause/delete/mute/report review. The admin token remains only in page memory for the active moderation session.

The static site and Hynoe Outpost remain usable while the backend is unconfigured or offline.

## Moderation and limits

- User text is validated and moderated server-side before publication.
- Ordinary profanity is censored and still posted.
- Severe abuse, threats, hateful slurs, sexual-minor content, doxxing patterns, scams/phishing, commands/control codes, staff impersonation, and disallowed links are blocked.
- Turnstile verifies the browser before a write in the initial migration stage; low-friction signed guest sessions are added by the next implementation stage.
- Per-visitor and global anti-spam windows use Durable Object transactions.
- Messages are limited to 240 characters, one line, and bounded retention.
- Raw IP addresses are not persisted in application storage. Abuse controls use salted ephemeral hashes.
- Public API responses never expose private hashes or moderation internals.
- Admin can pause chat, remove posts, and mute abusive guest identities.

## Checks

From the repository root run:

`node --test tests/*.test.mjs`

Browser verification is also required before production enablement. The release gate includes mobile/WebKit coverage and a source/network assertion that no game-hosting chat integration exists.

References: Cloudflare Turnstile and Durable Objects documentation.
