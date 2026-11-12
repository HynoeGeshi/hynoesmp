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
the existing JSON file is left untouched and the refresh exits nonzero so
automation reports the failure while the website keeps working.
"""

from __future__ import annotations
import datetime as dt
import html as html_lib
from html.parser import HTMLParser
import json
import pathlib
import re
import sys
import urllib.parse
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

def stream_status_hints(page: str) -> dict:
    """Read explicit status signals only from this channel's selected Streams grid."""
    match = re.search(r'(?:var\s+)?ytInitialData\s*=\s*', page)
    if not match:
        return {}
    try:
        data, _ = json.JSONDecoder().raw_decode(page[match.end():])
        tabs = data["contents"]["twoColumnBrowseResultsRenderer"]["tabs"]
        hints = {}
        for entry in tabs:
            tab = entry.get("tabRenderer", {})
            endpoint = tab.get("endpoint", {})
            url = endpoint.get("commandMetadata", {}).get("webCommandMetadata", {}).get("url", "")
            channel = endpoint.get("browseEndpoint", {}).get("canonicalBaseUrl", "")
            if tab.get("selected") is not True or url.casefold() != f"/@{CHANNEL_HANDLE}/streams".casefold() or channel.casefold() != f"/@{CHANNEL_HANDLE}".casefold():
                continue
            items = tab.get("content", {}).get("richGridRenderer", {}).get("contents", [])
            for item in items:
                model = item.get("richItemRenderer", {}).get("content", {}).get("lockupViewModel", {})
                video_id = model.get("contentId", "")
                if model.get("contentType") != "LOCKUP_CONTENT_TYPE_VIDEO" or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
                    continue
                statuses = set()
                rows = model.get("metadata", {}).get("lockupMetadataViewModel", {}).get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                if any(part.get("text", {}).get("content", "").startswith("Streamed ") for row in rows for part in row.get("metadataParts", [])):
                    statuses.add("latest")
                overlays = model.get("contentImage", {}).get("thumbnailViewModel", {}).get("overlays", [])
                for overlay in overlays:
                    for badge in overlay.get("thumbnailBottomOverlayViewModel", {}).get("badges", []):
                        style = badge.get("thumbnailBadgeViewModel", {}).get("badgeStyle")
                        if style == "THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE":
                            statuses.add("live")
                        elif style == "THUMBNAIL_OVERLAY_BADGE_STYLE_UPCOMING":
                            statuses.add("upcoming")
                if len(statuses) == 1:
                    hints[video_id] = statuses.pop()
        return hints
    except (ValueError, TypeError, KeyError, AttributeError):
        return {}

class _EmbedParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.frames = []

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        if tag == "iframe":
            self.frames.append(dict(attrs).get("src", ""))

def bot_gate_embed_info(video_id: str, stream_status: str | None) -> dict:
    # The public oEmbed video contract supplies an embed, not just a title.
    # Never run its HTML: validate the expected provider/author/ID, then discard it.
    if stream_status not in ("latest", "live", "upcoming"):
        raise ValueError("YouTube bot check has no verified channel stream-status hint")
    url = "https://www.youtube.com/oembed?" + urllib.parse.urlencode({
        "url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"})
    data = json.loads(get(url))
    if not isinstance(data, dict) or data.get("type") != "video" or data.get("provider_name") != "YouTube" or data.get("provider_url") != "https://www.youtube.com/" or data.get("author_url", "").rstrip("/") != f"https://www.youtube.com/@{CHANNEL_HANDLE}":
        raise ValueError("YouTube bot-check embed response has an unverified provider or author")
    title = data.get("title")
    parser = _EmbedParser()
    parser.feed(data.get("html", ""))
    src = urllib.parse.urlsplit(parser.frames[0]) if len(parser.frames) == 1 else None
    if not isinstance(title, str) or not title.strip() or parser.tags != ["iframe"] or not src or src.scheme != "https" or src.netloc != "www.youtube.com" or src.path != f"/embed/{video_id}":
        raise ValueError("YouTube bot-check response lacks a matching official video embed")
    return {"channel": f"@{CHANNEL_HANDLE}", "videoId": video_id, "title": title.strip(),
        "status": stream_status, "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg", "publishedAt": ""}

def video_info(video_id: str, *, stream_status: str | None = None) -> dict:
    page = get(f"https://www.youtube.com/watch?v={video_id}")
    # A title (or an HTTP 200 watch page) does not establish playability: private,
    # restricted, and removed videos can still have watch-page metadata.
    match = re.search(r'(?:var\s+)?ytInitialPlayerResponse\s*=\s*', page)
    if not match:
        raise ValueError("YouTube player metadata missing; cannot verify availability")
    try:
        player, _ = json.JSONDecoder().raw_decode(page[match.end():])
    except (ValueError, TypeError) as error:
        raise ValueError("YouTube player metadata unreadable") from error
    details = player.get("videoDetails", {})
    playback = player.get("playabilityStatus", {})
    reason = playback.get("reason", "")
    bot_gate = playback.get("status") == "LOGIN_REQUIRED" and re.fullmatch(
        r"Sign in to confirm you['’]re not a bot[.!]?", reason.strip(), re.I)
    if bot_gate and not details.get("isPrivate") and details.get("videoId", video_id) == video_id and playback.get("playableInEmbed") is not False:
        return bot_gate_embed_info(video_id, stream_status)
    if details.get("isPrivate") or playback.get("status") != "OK":
        raise ValueError(
            "YouTube video unavailable or private: "
            f"{playback.get('status', 'missing status')} / "
            f"{playback.get('reason', 'no reason provided')}"
        )
    if details.get("videoId") != video_id:
        raise ValueError("YouTube player video does not match requested video")
    if playback.get("playableInEmbed") is not True:
        raise ValueError("YouTube video has not allowed embedding")
    parsed = page_meta(page)

    # Prefer canonical watch-page metadata. If YouTube serves a reduced watch page
    # without title metadata, use its public oEmbed response before falling back.
    title = (
        meta_value(parsed, "property", "og:title")
        or meta_value(parsed, "name", "title")
        or "".join(parsed.page_title).removesuffix(" - YouTube").strip()
    )
    if not title:
        try:
            oembed_url = (
                "https://www.youtube.com/oembed?"
                f"url=https://www.youtube.com/watch?v={video_id}&format=json"
            )
            title = json.loads(get(oembed_url)).get("title", "").strip()
        except Exception:
            title = ""
    if not title:
        title = "Hynoe livestream"

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
        return 1

    hints = stream_status_hints(streams)
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
        return 1

    candidates = []
    for vid in ids[:6]:
        try:
            info = video_info(vid, stream_status=hints.get(vid))
            candidates.append(info)
            if info["status"] == "live":
                break
        except Exception as e:
            print(f"Skipping {vid}: {e}")

    if not candidates:
        print("No stream metadata could be read; leaving existing data untouched.")
        return 1

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

    # A reduced response has no new date information. Keep the last known date
    # for this exact video, never copy a different video's publication date.
    if (existing.get("videoId") == selected.get("videoId")
            and not selected.get("publishedAt")
            and isinstance(existing.get("publishedAt"), str)):
        selected["publishedAt"] = existing["publishedAt"]

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
