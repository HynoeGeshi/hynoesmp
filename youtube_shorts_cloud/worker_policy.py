DAILY_FLOOR = 10
DAILY_TARGET = 15

# This deployment has only a YouTube extraction path, not an authorized
# source-file ingestion path. Never claim jobs until a reviewed replacement
# can prove that source media is available. Do not turn this into an env toggle.
CLOUD_MEDIA_FETCH_BLOCKED = True
SOURCE_BLOCKER = "SOURCE_UNAVAILABLE"
MEDIA_HOLD_REVISION = "20261007-source-hold-v1"


def needed_for_target(ready_count: int) -> int:
    return max(0, DAILY_TARGET - max(0, int(ready_count)))


def _overlaps(a, b):
    if a.get("video_source_id") != b.get("video_source_id"):
        return False
    return int(a["start_ms"]) < int(b["end_ms"]) and int(b["start_ms"]) < int(a["end_ms"])


def choose_refill_windows(windows, limit: int):
    selected = []
    ranked = sorted(windows, key=lambda x: (-float(x.get("signal", 0)), int(x.get("start_ms", 0))))
    for window in ranked:
        if any(_overlaps(window, current) for current in selected):
            continue
        selected.append(window)
        if len(selected) >= max(0, int(limit)):
            break
    return selected


def youtube_client_strategies():
    """No alternative clients, IP bypasses, or extraction retries in Render."""
    return []
