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

Website download buttons point to the latest GitHub Release asset named:

`Hynoe_SMP_Client_Pack.zip`

Release download URL:

`https://github.com/HynoeGeshi/hynoesmp/releases/latest/download/Hynoe_SMP_Client_Pack.zip`

Keep that asset filename the same for future releases so the website download button always follows the newest release.

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
