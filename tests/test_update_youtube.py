import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("update_youtube", ROOT / "scripts" / "update_youtube.py")
update_youtube = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(update_youtube)


class YouTubeUpdaterTests(unittest.TestCase):
    def watch_page(self, status="OK", **details):
        player = {
            "playabilityStatus": {"status": status, "playableInEmbed": True},
            "videoDetails": {"videoId": "3IQpeV2i4Tc", "isPrivate": False},
        }
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


if __name__ == "__main__":
    unittest.main()
