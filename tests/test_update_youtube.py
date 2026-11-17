import importlib.util
import io
import json
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

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

    def test_bot_challenge_stops_watch_page_checks_and_keeps_published_bytes(self):
        streams = '{"videoId":"3IQpeV2i4Tc"},{"videoId":"QljzCRTJ-mA"}'
        challenge = self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot")
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            original = b'{"videoId":"QljzCRTJ-mA","title":"Existing broadcast"}\n'
            output.write_bytes(original)
            with (
                patch.dict(os.environ, {"YOUTUBE_DATA_API_KEY": "", "GITHUB_ACTIONS": "true"}),
                patch.object(update_youtube, "OUT", output),
                patch.object(update_youtube, "get", side_effect=[streams, challenge]) as get,
                io.StringIO() as messages,
                patch("sys.stdout", messages),
            ):
                self.assertEqual(update_youtube.main(), 1)
                self.assertIn("::warning title=YouTube refresh blocked::", messages.getvalue())
                self.assertIn("YOUTUBE_DATA_API_KEY", messages.getvalue())
            self.assertEqual(get.call_count, 2)
            self.assertEqual(output.read_bytes(), original)

    def test_configured_official_api_prefers_public_embeddable_live_stream_in_one_request(self):
        ids = ["QljzCRTJ-mA", "X8qVLJlVhNU", "3IQpeV2i4Tc", "AAAAAAAAAAA", "BBBBBBBBBBB"]
        streams = ",".join(json.dumps({"videoId": video_id}, separators=(",", ":")) for video_id in ids)

        def video(video_id, title, broadcast, visibility="public", channel="UCjWR1CZVFkrVk3S-TRrOGGQ", embeddable=True):
            timing = {"actualStartTime": "2026-11-17T12:00:00Z"}
            if broadcast == "none":
                timing["actualEndTime"] = "2026-11-17T13:00:00Z"
            return {
                "id": video_id,
                "snippet": {
                    "channelId": channel,
                    "title": title,
                    "liveBroadcastContent": broadcast,
                    "publishedAt": "2026-11-17T11:30:00Z",
                },
                "status": {"privacyStatus": visibility, "embeddable": embeddable},
                "liveStreamingDetails": timing,
            }

        response = {"items": [
            video(ids[1], "Another channel", "live", channel="UCaaaaaaaaaaaaaaaaaaaaaa"),
            video(ids[3], "Private", "live", visibility="private"),
            video(ids[4], "No embeds", "live", embeddable=False),
            video(ids[0], "Completed", "none"),
            video(ids[2], "Hynoe live", "live"),
        ]}
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            with (
                patch.dict(os.environ, {"YOUTUBE_DATA_API_KEY": "synthetic-test-key"}),
                patch.object(update_youtube, "OUT", output),
                patch.object(update_youtube, "get", return_value=streams),
                patch.object(update_youtube.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps(response).encode())) as request,
            ):
                self.assertEqual(update_youtube.main(), 0)
            stream = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual((stream["videoId"], stream["status"], stream["title"]), (ids[2], "live", "Hynoe live"))
        request.assert_called_once()
        sent = request.call_args.args[0]
        self.assertEqual(parse_qs(urlparse(sent.full_url).query)["id"], [",".join(ids)])
        self.assertEqual(sent.get_header("X-goog-api-key"), "synthetic-test-key")
        self.assertNotIn("synthetic-test-key", sent.full_url)

    def test_api_error_keeps_published_bytes_without_falling_back_to_watch_pages(self):
        streams = '{"videoId":"3IQpeV2i4Tc"}'
        denial = HTTPError("https://www.googleapis.com/youtube/v3/videos", 403, "Forbidden", {}, None)
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            original = b'{"videoId":"QljzCRTJ-mA","title":"Existing broadcast"}\n'
            output.write_bytes(original)
            with (
                patch.dict(os.environ, {"YOUTUBE_DATA_API_KEY": "synthetic-test-key"}),
                patch.object(update_youtube, "OUT", output),
                patch.object(update_youtube, "get", side_effect=[streams]) as get,
                patch.object(update_youtube.urllib.request, "urlopen", side_effect=denial) as request,
            ):
                self.assertEqual(update_youtube.main(), 1)
            request.assert_called_once()
            get.assert_called_once_with(update_youtube.STREAMS_URL)
            self.assertEqual(output.read_bytes(), original)

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
