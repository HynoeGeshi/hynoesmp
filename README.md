# Hynoe SMP

Official website and player guide for **Hynoe SMP**.

## Website
This repository is the production source for the Hynoe SMP website. It is proprietary, not open source. Public visibility does not grant permission to copy, rehost, redistribute, or build another product from the code or assets. See [COPYRIGHT.md](COPYRIGHT.md).

## GitHub Pages
Publish from:
- Branch: `main`
- Folder: `/ (root)`

## Modpack
The client pack is intentionally **not committed to this repository**.

The install guide's primary button points to the latest GitHub Release asset named `Hynoe_SMP_Modrinth.mrpack`. It was verified against the latest v1.0.1 release during the September 27 guide refresh. Keep that asset name for future releases so the one-click download continues to work. A manual ZIP may also be present, but its filename changes; advanced users are sent to the release page.

The separate interactive player dashboard remains owner-only and is intentionally not linked from this public site.

## Community
Discord: https://discord.gg/wYTePCkXd5


## YouTube broadcast automation

The home page contains a **Live From Hynoe SMP** broadcast station.

`/.github/workflows/update-youtube.yml` checks `https://www.youtube.com/@Hynoe/streams`
every 15 minutes and can also be run manually from the GitHub **Actions** tab.

It updates:

`data/stream.json`

Behavior:
- Current livestream = shown first with **LIVE NOW**
- No active livestream = newest completed stream
- Temporary YouTube parsing failure = existing website data is preserved

No YouTube API key or GitHub Secret is required.

After uploading this version to GitHub:
1. Open **Actions**
2. Open **Update Hynoe YouTube Broadcast**
3. Click **Run workflow**
4. Wait for the green check
5. The resulting commit updates `data/stream.json`
6. GitHub Pages redeploys the updated broadcast automatically

## Watch & Play (September 30 update)

`watch.html` adds the branded viewer outpost with the existing YouTube stream source and a floating mini-player while scrolling. `assets/watch-game.mjs` is the standalone mining game engine: workshop upgrades, auto-production, action-based expeditions, six permanent relics, gold rushes, 12 badges, repeating contracts, and indefinitely repeatable Legacy resets. Autosave and up to eight hours of offline production keep it usable across streams. Game rewards are browser-only, never server money/Tokens.

All guide headers link to Watch & Play. The original site content, modpack release links, domain, and stream updater remain intact.

Public chat is intentionally disabled until `relay/README.md` setup is complete. `data/chat-config.json` stores only a public relay URL and public Turnstile key. Bloom secrets belong exclusively in the Worker secret store. `chat-admin.html` supplies token-authenticated moderation. No live delivery is claimed without a real Minecraft test.

Run `node --test tests/*.test.mjs` for progression and relay tests. Preview with `python -m http.server 8765` and visit `/watch.html`.
