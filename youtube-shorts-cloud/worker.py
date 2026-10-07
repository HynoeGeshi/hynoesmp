import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GATEWAY_URL = os.environ.get("SHORTS_GATEWAY_URL", "")
WORKER_TOKEN = os.environ.get("SHORTS_WORKER_TOKEN", "")
WORKER_ID = os.environ.get("WORKER_ID", "render:hynoe-shorts-cloud")
WAKE_TOKEN = os.environ.get("SHORTS_WAKE_TOKEN", "")
STORAGE_TUS_ENDPOINT = os.environ.get(
    "STORAGE_TUS_ENDPOINT",
    "https://bgtxfzvzksgvradodafo.storage.supabase.co/storage/v1/upload/resumable",
)
BATCH_SIZE = max(1, min(5, int(os.environ.get("SHORTS_BATCH_SIZE", "3"))))

_work_lock = threading.Lock()
_last_run = {"started_at": None, "finished_at": None, "processed": 0, "last_error": None}


def gateway(payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GATEWAY_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-worker-token": WORKER_TOKEN,
            "User-Agent": "hynoe-shorts-cloud/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def ensure_runtime_packages():
    packages = []
    try:
        import yt_dlp  # noqa: F401
    except ImportError:
        packages.append("yt-dlp")
    try:
        import imageio_ffmpeg  # noqa: F401
    except ImportError:
        packages.append("imageio-ffmpeg")
    try:
        import tusclient  # noqa: F401
    except ImportError:
        packages.append("tuspy")
    if packages:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "--no-input", *packages]
        )


def download_section(clip, output_path):
    start = max(0.0, float(clip["start_ms"]) / 1000.0)
    end = max(start + 1.0, float(clip["end_ms"]) / 1000.0)
    url = f"https://www.youtube.com/watch?v={clip['youtube_video_id']}"
    template = os.path.join(os.path.dirname(output_path), "source.%(ext)s")
    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--download-sections",
        f"*{start:.3f}-{end:.3f}",
        "--force-keyframes-at-cuts",
        "-f",
        "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
        "--merge-output-format",
        "mp4",
        "-o",
        template,
        url,
    ]
    subprocess.check_call(cmd, timeout=900)
    candidates = [p for p in os.listdir(os.path.dirname(output_path)) if p.startswith("source.")]
    if not candidates:
        raise RuntimeError("yt-dlp produced no source clip")
    return os.path.join(os.path.dirname(output_path), candidates[0])


def render_vertical(source_path, output_path):
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    vf = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280"
    cmd = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        source_path,
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output_path,
    ]
    subprocess.check_call(cmd, timeout=900)
    if not os.path.exists(output_path) or os.path.getsize(output_path) < 100_000:
        raise RuntimeError("rendered clip missing or too small")


def upload_tus(file_path, upload_path, token):
    from tusclient import client

    tus = client.TusClient(
        STORAGE_TUS_ENDPOINT,
        headers={"x-signature": token, "x-upsert": "true"},
    )
    with open(file_path, "rb") as stream:
        uploader = tus.uploader(
            file_stream=stream,
            chunk_size=6 * 1024 * 1024,
            metadata={
                "bucketName": "clip-previews",
                "objectName": upload_path,
                "contentType": "video/mp4",
                "cacheControl": "3600",
            },
        )
        uploader.upload()


def process_one():
    claim = gateway({"action": "claim", "worker_id": WORKER_ID})
    clip = claim.get("clip")
    if not clip:
        return False
    clip_id = clip["clip_id"]
    lease_token = clip["lease_token"]
    try:
        ensure_runtime_packages()
        with tempfile.TemporaryDirectory(prefix="hynoe-short-") as tmp:
            rendered = os.path.join(tmp, "rendered.mp4")
            source = download_section(clip, rendered)
            gateway({"action": "renew", "clip_id": clip_id, "lease_token": lease_token})
            render_vertical(source, rendered)
            upload = claim["upload"]
            upload_tus(rendered, upload["path"], upload["token"])
            finished = gateway(
                {
                    "action": "finish",
                    "clip_id": clip_id,
                    "lease_token": lease_token,
                    "preview_uri": upload["path"],
                }
            )
            if not finished.get("ok"):
                raise RuntimeError("lease completion rejected")
        return True
    except Exception as exc:
        try:
            gateway(
                {
                    "action": "retry",
                    "clip_id": clip_id,
                    "lease_token": lease_token,
                    "error": str(exc)[:1000],
                }
            )
        except Exception:
            pass
        raise


def run_batch():
    if not _work_lock.acquire(blocking=False):
        return
    _last_run.update(started_at=time.time(), processed=0, last_error=None)
    try:
        for _ in range(BATCH_SIZE):
            try:
                if not process_one():
                    break
                _last_run["processed"] += 1
            except Exception as exc:
                _last_run["last_error"] = str(exc)[:500]
                break
    finally:
        _last_run["finished_at"] = time.time()
        _work_lock.release()


def kick():
    threading.Thread(target=run_batch, daemon=True).start()


class Handler(BaseHTTPRequestHandler):
    def _json(self, payload, status=200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            self._json({"ok": True, "worker": WORKER_ID, "busy": _work_lock.locked(), "last_run": _last_run})
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        if self.path != "/work":
            return self._json({"error": "not found"}, 404)
        if not WAKE_TOKEN or self.headers.get("x-wake-token") != WAKE_TOKEN:
            return self._json({"error": "unauthorized"}, 401)
        kick()
        self._json({"ok": True, "accepted": True, "busy": _work_lock.locked()}, 202)

    def log_message(self, fmt, *args):
        print("http", fmt % args, flush=True)


def main():
    if not GATEWAY_URL or not WORKER_TOKEN or not WAKE_TOKEN:
        raise SystemExit("SHORTS_GATEWAY_URL, SHORTS_WORKER_TOKEN and SHORTS_WAKE_TOKEN are required")
    port = int(os.environ.get("PORT", "10000"))
    kick()
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"hynoe shorts cloud worker listening on {port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
