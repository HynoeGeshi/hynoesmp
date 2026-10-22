import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("update_youtube", ROOT / "scripts" / "update_youtube.py")
update_youtube = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(update_youtube)


class YouTubeUpdaterTests(unittest.TestCase):
    def watch_page(self, status="OK", reason=None, **details):
        player = {
            "playabilityStatus": {"status": status, "playableInEmbed": True},
            "videoDetails": {"videoId": "3IQpeV2i4Tc", "isPrivate": False},
        }
        if reason:
            player["playabilityStatus"]["reason"] = reason
        player["videoDetails"].update(details)
        return '<script>var ytInitialPlayerResponse = ' + json.dumps(player) + ';</script>'

    def test_video_info_uses_oembed_title_when_watch_page_metadata_is_missing(self):
        watch_html = self.watch_page()
        oembed = json.dumps({"title": "GEARS OF WAR: E-DAY on INSANE Difficulty 🔥 I CAN’T STOP PLAYING THIS"})

        def fake_get(url):
            if "oembed" in url:
                return oembed
            return watch_html

        with patch.object(update_youtube, "get", side_effect=fake_get):
            info = update_youtube.video_info("3IQpeV2i4Tc")

        self.assertEqual(
            info["title"],
            "GEARS OF WAR: E-DAY on INSANE Difficulty 🔥 I CAN’T STOP PLAYING THIS",
        )

    def test_rejects_unavailable_or_private_watch_page_instead_of_publishing_its_title(self):
        for page in [self.watch_page("UNPLAYABLE"), self.watch_page("LOGIN_REQUIRED"), self.watch_page(isPrivate=True)]:
            with self.subTest(page=page), patch.object(update_youtube, "get", return_value=page):
                with self.assertRaisesRegex(ValueError, "unavailable|private"):
                    update_youtube.video_info("3IQpeV2i4Tc")

    def test_rejects_video_that_disallows_embedding(self):
        page = self.watch_page().replace('"playableInEmbed": true', '"playableInEmbed": false')
        with patch.object(update_youtube, "get", return_value=page):
            with self.assertRaisesRegex(ValueError, "embedding"):
                update_youtube.video_info("3IQpeV2i4Tc")

    def test_reduced_or_mismatched_player_page_cannot_silently_publish_a_video(self):
        for page in ["<html><title>YouTube</title></html>", self.watch_page(videoId="AAAAAAAAAAA")]:
            with self.subTest(page=page), patch.object(update_youtube, "get", return_value=page):
                with self.assertRaisesRegex(ValueError, "player|match"):
                    update_youtube.video_info("3IQpeV2i4Tc")

    def test_failed_refresh_returns_nonzero_and_preserves_existing_json_bytes(self):
        streams = '<script>var ytInitialData = {"videoRenderer":{"videoId":"3IQpeV2i4Tc"}};</script>'
        unavailable = self.watch_page("LOGIN_REQUIRED")
        cases = [
            ("streams request failed", OSError("request blocked")),
            ("streams markup has no IDs", lambda url: "<html>YouTube</html>"),
            ("all watch pages unverifiable", lambda url: streams if url == update_youtube.STREAMS_URL else unavailable),
        ]
        original = b'{\n  "videoId": "preserve-me", "unknown": "keep this byte formatting"\n}\n'
        for name, response in cases:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                output = pathlib.Path(directory) / "stream.json"
                output.write_bytes(original)
                with patch.object(update_youtube, "OUT", output), patch.object(update_youtube, "get", side_effect=response):
                    result = update_youtube.main()
                self.assertEqual(output.read_bytes(), original)
                self.assertNotEqual(result, 0)

    def test_unavailable_player_error_includes_status_and_reason(self):
        page = self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm availability")
        with patch.object(update_youtube, "get", return_value=page):
            with self.assertRaisesRegex(ValueError, "LOGIN_REQUIRED.*Sign in to confirm availability"):
                update_youtube.video_info("3IQpeV2i4Tc")

    def test_unchanged_verified_stream_returns_zero_without_rewriting_json(self):
        info = {
            "channel": "@Hynoe", "videoId": "QljzCRTJ-mA", "title": "Latest Hynoe stream",
            "status": "latest", "url": "https://www.youtube.com/watch?v=QljzCRTJ-mA",
            "thumbnail": "https://i.ytimg.com/vi/QljzCRTJ-mA/maxresdefault.jpg",
            "publishedAt": "2026-10-21T23:29:30Z",
        }
        original = json.dumps({**info, "updatedAt": "keep-existing-timestamp", "extension": "preserve"}, indent=4).encode()
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            output.write_bytes(original)
            with patch.object(update_youtube, "OUT", output), patch.object(update_youtube, "get", return_value='{"videoId":"QljzCRTJ-mA"}'), patch.object(update_youtube, "video_info", return_value=info):
                self.assertEqual(update_youtube.main(), 0)
            self.assertEqual(output.read_bytes(), original)

    def test_active_live_stream_takes_priority_over_newer_completed_stream(self):
        streams = '{"videoId":"QljzCRTJ-mA"},{"videoId":"3IQpeV2i4Tc"},{"videoId":"QljzCRTJ-mA"}'
        candidates = [
            {"videoId": "QljzCRTJ-mA", "status": "latest", "title": "Completed"},
            {"videoId": "3IQpeV2i4Tc", "status": "live", "title": "Live now"},
        ]
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            with patch.object(update_youtube, "OUT", output), patch.object(update_youtube, "get", return_value=streams), patch.object(update_youtube, "video_info", side_effect=candidates) as inspect:
                self.assertEqual(update_youtube.main(), 0)
            self.assertEqual(json.loads(output.read_text())["videoId"], "3IQpeV2i4Tc")
            self.assertEqual([call.args[0] for call in inspect.call_args_list], ["QljzCRTJ-mA", "3IQpeV2i4Tc"])


if __name__ == "__main__":
    unittest.main()
