"""Request a Pages build when a successful broadcast refresh has not reached the site."""

import json
import os
from pathlib import Path
import urllib.error
import urllib.request


def read_json(url, *, token="", method="GET"):
    headers = {"Accept": "application/json", "Cache-Control": "no-cache"}
    if token:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    request = urllib.request.Request(url, headers=headers, method=method)
    if token:
        request.add_unredirected_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.status, json.load(response)


def publish(feed, source_sha, changed, feed_url, repo_url, token):
    if not changed:
        try:
            _, live_feed = read_json(feed_url)
        except (OSError, ValueError):
            print("Published stream data could not be read. The next refresh can check again.")
            return False
        if not isinstance(live_feed, dict) or not live_feed.get("videoId"):
            print("Published stream data is invalid. The next refresh can check again.")
            return False
        if live_feed == feed:
            print("Broadcast data is already live.")
            return False

    builds_url = f"{repo_url}/pages/builds"
    _, build = read_json(f"{builds_url}/latest", token=token)
    if build["status"] in ("queued", "building"):
        print("A Pages build is already in progress.")
        return False
    if build["status"] == "built" and build["commit"] == source_sha:
        print("Pages already built this revision. The public feed may still be cached.")
        return False

    _, main_ref = read_json(f"{repo_url}/git/ref/heads/main", token=token)
    if main_ref["object"]["sha"] != source_sha:
        print("Main moved after this refresh. The next refresh can verify the newer revision.")
        return False

    status, _ = read_json(builds_url, token=token, method="POST")
    if status != 201:
        raise ValueError("Pages did not accept the build request.")
    print("Requested a Pages build for the broadcast feed.")
    return True


def main():
    feed = json.loads(Path("data/stream.json").read_text(encoding="utf-8"))
    run = os.environ["GITHUB_RUN_ID"]
    attempt = os.environ["GITHUB_RUN_ATTEMPT"]
    feed_url = f"https://hynoesmp.com/data/stream.json?verify={run}-{attempt}"
    repo_url = f"{os.environ['GITHUB_API_URL']}/repos/{os.environ['GITHUB_REPOSITORY']}"
    try:
        publish(
            feed,
            os.environ["BROADCAST_SOURCE_SHA"],
            os.environ["BROADCAST_CHANGED"] == "true",
            feed_url,
            repo_url,
            os.environ["GITHUB_TOKEN"],
        )
    except urllib.error.HTTPError as error:
        print(f"::error::GitHub Pages request failed with HTTP {error.code}.")
        return 1
    except (OSError, KeyError, TypeError, ValueError):
        print("::error::GitHub Pages could not confirm its build state or accept the request.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
