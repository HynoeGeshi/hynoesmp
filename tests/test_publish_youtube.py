import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import publish_youtube


class PublishYouTubeTests(unittest.TestCase):
    def setUp(self):
        self.source = "a" * 40
        self.current = {"videoId": "current1234", "status": "latest"}
        self.stale = {"videoId": "oldvideo123", "status": "latest"}
        self.feed_url = "https://hynoesmp.com/data/stream.json?verify=42-1"
        self.api_url = "https://api.github.com/repos/HynoeGeshi/hynoesmp"
        self.build_url = f"{self.api_url}/pages/builds"
        self.ref_url = f"{self.api_url}/git/ref/heads/main"
        self.responses = {
            ("GET", self.feed_url): (200, self.stale),
            ("GET", f"{self.build_url}/latest"): (
                200, {"status": "built", "commit": "b" * 40}
            ),
            ("GET", self.ref_url): (200, {"object": {"sha": self.source}}),
            ("POST", self.build_url): (201, {"status": "queued"}),
        }
        self.calls = []

    def run_publish(self, changed=False):
        def respond(request, *, timeout):
            key = request.get_method(), request.full_url
            self.calls.append(key)
            if request.full_url == self.feed_url:
                self.assertEqual(request.get_header("Cache-control"), "no-cache")
                self.assertIsNone(request.get_header("Authorization"))
            else:
                self.assertEqual(request.get_header("Authorization"), "Bearer fixture-token")
            result = self.responses[key]
            if isinstance(result, Exception):
                raise result
            status, payload = result
            response = io.BytesIO(json.dumps(payload).encode())
            response.status = status
            return response

        with patch.object(publish_youtube.urllib.request, "urlopen", side_effect=respond):
            return publish_youtube.publish(
                self.current, self.source, changed, self.feed_url, self.api_url, "fixture-token"
            )

    def test_push_requests_one_build_for_current_main(self):
        self.assertTrue(self.run_publish(changed=True))
        self.assertEqual(self.calls, [
            ("GET", f"{self.build_url}/latest"), ("GET", self.ref_url), ("POST", self.build_url)
        ])

    def test_retry_detects_stale_live_feed_without_a_new_commit(self):
        self.assertTrue(self.run_publish())
        self.assertEqual(self.calls, [
            ("GET", self.feed_url), ("GET", f"{self.build_url}/latest"),
            ("GET", self.ref_url), ("POST", self.build_url)
        ])

    def test_current_live_feed_skips_build_queries(self):
        self.responses["GET", self.feed_url] = (200, self.current)
        self.assertFalse(self.run_publish())
        self.assertEqual(self.calls, [("GET", self.feed_url)])

    def test_bad_live_response_defers_recovery(self):
        for result in (OSError("transient network failure"), (200, {"error": "unavailable"})):
            with self.subTest(result=result):
                self.calls.clear()
                self.responses["GET", self.feed_url] = result
                self.assertFalse(self.run_publish())
                self.assertEqual(self.calls, [("GET", self.feed_url)])

    def test_pending_build_or_built_source_skips_redundant_request(self):
        builds = [
            {"status": "queued", "commit": self.source},
            {"status": "building", "commit": "b" * 40},
            {"status": "built", "commit": self.source},
        ]
        for build in builds:
            with self.subTest(build=build):
                self.calls.clear()
                self.responses["GET", f"{self.build_url}/latest"] = (200, build)
                self.assertFalse(self.run_publish())
                self.assertNotIn(("POST", self.build_url), self.calls)

    def test_newer_main_does_not_get_a_build_from_the_older_run(self):
        self.responses["GET", self.ref_url] = (200, {"object": {"sha": "c" * 40}})
        self.assertFalse(self.run_publish(changed=True))
        self.assertNotIn(("POST", self.build_url), self.calls)

    def test_failed_build_request_is_reported_without_retrying(self):
        self.responses["POST", self.build_url] = OSError("transient build request failure")
        with self.assertRaises(OSError):
            self.run_publish(changed=True)
        self.assertEqual(self.calls.count(("POST", self.build_url)), 1)


if __name__ == "__main__":
    unittest.main()
