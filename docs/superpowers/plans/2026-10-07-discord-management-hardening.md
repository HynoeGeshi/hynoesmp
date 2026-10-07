# Hynoe Discord management hardening

Execution: continue the existing approved overhaul in this session, as requested by the owner. Extend control-bridge; do not create a second bot or rebuild chat mirroring.

1. Reproduce guild-boundary bypasses, role privilege escalation, missing previews/embeds, and Bloom-dependent configuration with regression tests.
2. Bind every channel operation (including parent IDs), role operation, and webhook deletion to the configured guild. Preserve the legacy channel allowlist and require management mode for structural tools.
3. Add dry-run previews to Discord writes. High-impact execution requires a short-lived, single-use approval issued in the owner dashboard, bound to the exact tool, input and guild. MCP cannot mint approval. Invalidated approvals after process restart fail closed.
4. Extend the existing REST client/tools with embeds, bot message edits, announcement publishing, capability diagnostics, and metadata-only audit records. Discord writes are never automatically retried.
5. Make Bloom credentials optional for Discord startup; Bloom tools remain disabled until configured.
6. Verify with the full control-bridge test suite, typecheck, build, secret scan, live health and authenticated guild inventory. Test one reversible bot write before migration.
7. Preserve all channel history and SMP chat ID 1320704486615941190. Build an inventory-based migration preview for Start Here, Community, Live / Content, SMP, Outpost, Flicks, Events, Support, Staff / Control and hidden Future Services. Keep gold identity permanent, seasonal themes in copy/embeds.
8. Implement live migration only after bot and owner auth work. Gate major deletion, bulk roles, moderation, permission expansion and large batches through owner approval. Do not claim onboarding or recurring automation works until it is tested.

Known live blocker: Render /health reports missing DISCORD_BOT_TOKEN and ALLOWED_SUPABASE_USER_ID, as well as BLOOM_API_KEY under the old configuration. No bot credential has been requested in chat.
