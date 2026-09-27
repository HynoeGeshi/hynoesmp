# Hynoe SMP

Official website and player guide for **Hynoe SMP**.

## Website
This repository is the production source for the Hynoe SMP website.

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
