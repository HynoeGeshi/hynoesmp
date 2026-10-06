# Hynoe SMP Site Help Bot + Global Chat — Spec Self-Review Rulings

Date: 2026-10-06
Applies to: `2026-10-06-site-help-global-chat-design.md`

The design spec passed self-review with two architecture choices made explicit before implementation planning:

1. **Guest CAPTCHA/auth flow**
   - Use Cloudflare Turnstile through Supabase Auth CAPTCHA protection.
   - The browser passes the Turnstile token into `supabase.auth.signInAnonymously({ options: { captchaToken } })`.
   - CAPTCHA is required for anonymous identity bootstrap, not every normal chat message.
   - After bootstrap, chat abuse controls use authenticated identity plus server-side rate limits/mute/ban policy.

2. **Global Chat write path**
   - Use one authenticated Supabase Edge Function named `send-site-message` for public message creation.
   - The browser does not receive direct unrestricted insert permission on `site_chat_messages`.
   - The function verifies the caller JWT, profile state, rate limits, message/reply validation, then performs the privileged insert with server-side credentials.
   - Realtime delivery still occurs from the persisted database change through the private `site:global` Broadcast topic.

These rulings remove the only material implementation ambiguity found during self-review. They do not change product scope: Global Chat and Ask Hynoe remain website-native and independent of Minecraft, Bloom, Discord, and the control bridge.
