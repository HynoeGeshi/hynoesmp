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
    def stream_grid(self, status="latest", video_id="dc--5uYFc8c", channel="Hynoe"):
        # Matches the selected public /streams tab's current lockupViewModel shape.
        badges = [] if status == "latest" else [{"thumbnailBadgeViewModel": {
            "text": "LIVE" if status == "live" else "UPCOMING",
            "badgeStyle": "THUMBNAIL_OVERLAY_BADGE_STYLE_" + status.upper(),
        }}]
        model = {"contentId": video_id, "contentType": "LOCKUP_CONTENT_TYPE_VIDEO",
            "rendererContext": {"commandContext": {"onTap": {"innertubeCommand": {"watchEndpoint": {"videoId": video_id}}}}},
            "metadata": {"lockupMetadataViewModel": {"title": {"content": "A title saying LIVE is not status"},
                "metadata": {"contentMetadataViewModel": {"metadataRows": [{"metadataParts": [
                    {"text": {"content": "Streamed 2d ago" if status == "latest" else "Watching now"}}
                ]}]}}}},
            "contentImage": {"thumbnailViewModel": {"overlays": [{"thumbnailBottomOverlayViewModel": {"badges": badges}}]}}}
        data = {"contents": {"twoColumnBrowseResultsRenderer": {"tabs": [{"tabRenderer": {
            "selected": True, "endpoint": {"commandMetadata": {"webCommandMetadata": {"url": f"/@{channel}/streams"}}, "browseEndpoint": {"canonicalBaseUrl": f"/@{channel}"}},
            "content": {"richGridRenderer": {"contents": [{"richItemRenderer": {"content": {"lockupViewModel": model}}}]}}
        }}]}}}
        return "<script>var ytInitialData = " + json.dumps(data, separators=(",", ":")) + ";</script>"

    def oembed(self, **changes):
        data = {"version": "1.0", "type": "video", "provider_name": "YouTube",
            "provider_url": "https://www.youtube.com/", "author_name": "Hynoe", "author_url": "https://www.youtube.com/@Hynoe",
            "title": "Festival Time on Hynoe SMP!", "width": 200, "height": 113,
            "html": '<iframe src="https://www.youtube.com/embed/dc--5uYFc8c?feature=oembed"></iframe>'}
        data.update(changes)
        return json.dumps(data)

    def bot_gate_run(self, *, grid=None, page=None, embed=None):
        grid = self.stream_grid() if grid is None else grid
        page = self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot", videoId="dc--5uYFc8c") if page is None else page
        embed = self.oembed() if embed is None else embed
        original = b'{\n "videoId":"keep-last-good", "extension":"preserve exact bytes"\n}\n'
        def fake_get(url):
            if url == update_youtube.STREAMS_URL:
                return grid
            if "oembed" in url:
                if isinstance(embed, Exception):
                    raise embed
                return embed
            return page
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / "stream.json"
            output.write_bytes(original)
            with patch.object(update_youtube, "OUT", output), patch.object(update_youtube, "get", side_effect=fake_get):
                result = update_youtube.main()
            return result, output.read_bytes(), original

    def test_explicit_runner_bot_gate_refreshes_from_verified_official_embed_and_completed_stream_hint(self):
        result, raw, _ = self.bot_gate_run()
        self.assertEqual(result, 0)
        data = json.loads(raw)
        self.assertEqual(data["videoId"], "dc--5uYFc8c")
        self.assertEqual(data["status"], "latest")
        self.assertEqual(data["title"], "Festival Time on Hynoe SMP!")
        self.assertEqual(data["publishedAt"], "", "relative renderer text must not fabricate an exact publication timestamp")

    def test_bot_gate_uses_structured_live_hint_instead_of_title_words(self):
        for status in ["live", "upcoming"]:
            with self.subTest(status=status):
                result, raw, _ = self.bot_gate_run(grid=self.stream_grid(status=status))
                self.assertEqual(result, 0)
                self.assertEqual(json.loads(raw)["status"], status)

    def test_bot_gate_refuses_missing_unknown_or_wrong_channel_status_hints(self):
        grids = ['{"videoId":"dc--5uYFc8c","title":"LIVE NOW"}',
            self.stream_grid(status="unknown"), self.stream_grid(channel="AnotherChannel")]
        for grid in grids:
            with self.subTest(grid=grid):
                result, raw, original = self.bot_gate_run(grid=grid)
                self.assertNotEqual(result, 0)
                self.assertEqual(raw, original)

    def test_bot_gate_rejects_untrusted_or_nonvideo_oembed_responses_without_replacing_last_good(self):
        bad = [dict(type="link"), dict(provider_name="Other"), dict(provider_url="https://example.com/"),
            dict(author_url="https://www.youtube.com/@AnotherChannel"), dict(title=""), dict(html=""),
            dict(html='<iframe src="https://www.youtube.com/embed/AAAAAAAAAAA"></iframe>'),
            dict(html='<iframe src="http://www.youtube.com/embed/dc--5uYFc8c"></iframe>'),
            dict(html='<iframe src="https://www.youtube.com.example.com/embed/dc--5uYFc8c"></iframe>'),
            dict(html='<iframe src="https://www.youtube.com:444/embed/dc--5uYFc8c"></iframe>'),
            dict(html='<iframe src="https://www.youtube.com/embed/dc--5uYFc8c"></iframe><iframe src="https://www.youtube.com/embed/dc--5uYFc8c"></iframe>')]
        for changes in bad:
            with self.subTest(changes=changes):
                result, raw, original = self.bot_gate_run(embed=self.oembed(**changes))
                self.assertNotEqual(result, 0)
                self.assertEqual(raw, original)
        result, raw, original = self.bot_gate_run(embed=json.dumps({"title": "Only a title"}))
        self.assertNotEqual(result, 0)
        self.assertEqual(raw, original)

    def test_bot_gate_does_not_override_private_age_geo_or_embed_disabled_restrictions(self):
        pages = [self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm your age", videoId="dc--5uYFc8c"),
            self.watch_page("UNPLAYABLE", reason="The uploader has not made this video available in your country", videoId="dc--5uYFc8c"),
            self.watch_page("UNPLAYABLE", reason="Playback on other websites has been disabled by the video owner", videoId="dc--5uYFc8c"),
            self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot", videoId="dc--5uYFc8c", isPrivate=True),
            self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot", videoId="AAAAAAAAAAA"),
            self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot", videoId="dc--5uYFc8c").replace('"playableInEmbed": true', '"playableInEmbed": false')]
        for page in pages:
            with self.subTest(page=page):
                result, raw, original = self.bot_gate_run(page=page)
                self.assertNotEqual(result, 0)
                self.assertEqual(raw, original)

    def test_bot_gate_oembed_transport_or_json_failure_preserves_exact_last_good_bytes(self):
        for embed in [OSError("provider unavailable"), "not json", "null", "[]"]:
            with self.subTest(embed=embed):
                result, raw, original = self.bot_gate_run(embed=embed)
                self.assertNotEqual(result, 0)
                self.assertEqual(raw, original)

    def test_bot_gate_retains_known_date_only_for_the_same_video_without_rewriting(self):
        for existing_id in ["dc--5uYFc8c", "AAAAAAAAAAA"]:
            with self.subTest(existing_id=existing_id), tempfile.TemporaryDirectory() as directory:
                info = {
                    "channel": "@Hynoe", "videoId": existing_id,
                    "title": "Festival Time on Hynoe SMP!", "status": "latest",
                    "url": f"https://www.youtube.com/watch?v={existing_id}",
                    "thumbnail": f"https://i.ytimg.com/vi/{existing_id}/maxresdefault.jpg",
                    "publishedAt": "2026-10-25T01:05:26-07:00", "updatedAt": "keep-known-date",
                }
                original = json.dumps(info, indent=4).encode()
                output = pathlib.Path(directory) / "stream.json"
                output.write_bytes(original)
                page = self.watch_page("LOGIN_REQUIRED", reason="Sign in to confirm you’re not a bot", videoId="dc--5uYFc8c")
                def fake_get(url):
                    if url == update_youtube.STREAMS_URL:
                        return self.stream_grid()
                    return self.oembed() if "oembed" in url else page
                with patch.object(update_youtube, "OUT", output), patch.object(update_youtube, "get", side_effect=fake_get):
                    self.assertEqual(update_youtube.main(), 0)
                if existing_id == "dc--5uYFc8c":
                    self.assertEqual(output.read_bytes(), original)
                else:
                    self.assertEqual(json.loads(output.read_bytes())["publishedAt"], "")

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
