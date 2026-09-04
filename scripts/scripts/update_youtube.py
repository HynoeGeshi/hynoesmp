#!/usr/bin/env python3
"""
Update data/stream.json from the public @Hynoe YouTube Streams page.

No YouTube API key is required. The script:
1) reads the public /streams page,
2) collects recent stream video IDs,
3) checks recent watch pages,
4) prioritizes an active livestream,
5) otherwise publishes the newest completed stream.

If YouTube changes its page markup or temporarily blocks the request,
the existing JSON file is left untouched so the website keeps working.
"""

from __future__ import annotations
import datetime as dt
import html as html_lib
from html.parser import HTMLParser
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "stream.json"
CHANNEL_HANDLE = "Hynoe"
STREAMS_URL = f"https://www.youtube.com/@{CHANNEL_HANDLE}/streams"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/152.0 Safari/537.36"
)

def get(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")

def first(patterns, text, default=""):
    for pattern in patterns:
        m = re.search(pattern, text, re.I | re.S)
        if m:
            return html_lib.unescape(m.group(1)).strip()
    return default

class _MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = []
        self.in_title = False
        self.page_title = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "meta":
            self.meta.append({k.lower(): v for k, v in attrs if k and v is not None})
        elif tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.page_title.append(data)

def page_meta(text: str):
    parser = _MetaParser()
    parser.feed(text)
    return parser

def meta_value(parser, attr, value):
    value = value.lower()
    for item in parser.meta:
        if item.get(attr, "").lower() == value and item.get("content"):
            return html_lib.unescape(item["content"]).strip()
    return ""

def video_info(video_id: str) -> dict:
    page = get(f"https://www.youtube.com/watch?v={video_id}")
    parsed = page_meta(page)

    # Use the canonical page metadata only. The old generic JSON `title` fallback
    # could accidentally grab tiny unrelated values such as "4" from YouTube's page data.
    title = (
        meta_value(parsed, "property", "og:title")
        or meta_value(parsed, "name", "title")
        or "".join(parsed.page_title).removesuffix(" - YouTube").strip()
        or "Hynoe livestream"
    )

    is_live = bool(re.search(r'"isLiveNow"\s*:\s*true', page))
    is_upcoming = bool(re.search(r'"isUpcoming"\s*:\s*true', page))

    published = first([
        r'"publishDate":"([^"]+)"',
        r'"uploadDate":"([^"]+)"',
        r'<meta\s+itemprop="datePublished"\s+content="([^"]+)"',
    ], page, "")

    thumb = first([
        r'<meta\s+property="og:image"\s+content="([^"]+)"',
    ], page, f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg")

    return {
        "channel": f"@{CHANNEL_HANDLE}",
        "videoId": video_id,
        "title": title,
        "status": "live" if is_live else ("upcoming" if is_upcoming else "latest"),
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": thumb,
        "publishedAt": published,
    }

def main() -> int:
    try:
        streams = get(STREAMS_URL)
    except Exception as e:
        print(f"YouTube streams page unavailable: {e}")
        return 0

    ids = []
    seen = set()
    for vid in re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', streams):
        if vid not in seen:
            seen.add(vid)
            ids.append(vid)
        if len(ids) >= 12:
            break

    if not ids:
        print("No stream video IDs found; leaving existing data untouched.")
        return 0

    candidates = []
    for vid in ids[:6]:
        try:
            info = video_info(vid)
            candidates.append(info)
            if info["status"] == "live":
                break
        except Exception as e:
            print(f"Skipping {vid}: {e}")

    if not candidates:
        print("No stream metadata could be read; leaving existing data untouched.")
        return 0

    # Active livestream wins. Otherwise prefer the newest completed stream.
    selected = next((c for c in candidates if c["status"] == "live"), None)
    if selected is None:
        selected = next((c for c in candidates if c["status"] == "latest"), None)
    if selected is None:
        selected = candidates[0]

    existing = {}
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text(encoding="utf-8"))
        except Exception:
            existing = {}

    stable_fields = ["channel","videoId","title","status","url","thumbnail","publishedAt"]
    changed = any(existing.get(k) != selected.get(k) for k in stable_fields)
    if not changed:
        print(f"No broadcast change: {selected['status']} / {selected['videoId']}")
        return 0

    selected["updatedAt"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(selected, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated broadcast: {selected['status']} / {selected['videoId']} / {selected['title']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
