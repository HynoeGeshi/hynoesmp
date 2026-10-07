DAILY_FLOOR = 10
DAILY_TARGET = 15


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
    return [
        ["--extractor-args", "youtube:player_client=web_embedded;player_skip=webpage,configs"],
        ["--extractor-args", "youtube:player_client=android_vr;player_skip=webpage,configs"],
        ["--extractor-args", "youtube:player_client=tv_simply,web_safari;player_skip=webpage,configs"],
    ]
