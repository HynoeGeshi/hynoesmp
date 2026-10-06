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
    def test_video_info_uses_oembed_title_when_watch_page_metadata_is_missing(self):
        watch_html = '<html><head></head><body>"isLiveNow":false</body></html>'
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


if __name__ == "__main__":
    unittest.main()
