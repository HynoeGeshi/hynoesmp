import unittest

from youtube_shorts_cloud.worker_policy import (
    DAILY_FLOOR,
    DAILY_TARGET,
    needed_for_target,
    choose_refill_windows,
    youtube_client_strategies,
)


class DailyTargetTests(unittest.TestCase):
    def test_daily_policy_keeps_ten_floor_and_fifteen_target(self):
        self.assertEqual(DAILY_FLOOR, 10)
        self.assertEqual(DAILY_TARGET, 15)
        self.assertEqual(needed_for_target(3), 12)
        self.assertEqual(needed_for_target(15), 0)
        self.assertEqual(needed_for_target(18), 0)

    def test_refill_prefers_high_signal_non_overlapping_windows(self):
        windows = [
            {"video_source_id": "a", "start_ms": 0, "end_ms": 30000, "signal": 18},
            {"video_source_id": "a", "start_ms": 10000, "end_ms": 40000, "signal": 17},
            {"video_source_id": "b", "start_ms": 0, "end_ms": 30000, "signal": 16},
            {"video_source_id": "c", "start_ms": 0, "end_ms": 30000, "signal": 15},
        ]
        selected = choose_refill_windows(windows, 3)
        self.assertEqual(len(selected), 3)
        self.assertEqual(selected[0]["video_source_id"], "a")
        self.assertFalse(any(x["video_source_id"] == "a" and x["start_ms"] == 10000 for x in selected))

    def test_cloud_extraction_has_guest_session_fallbacks(self):
        strategies = youtube_client_strategies()
        self.assertGreaterEqual(len(strategies), 3)
        joined = " ".join(" ".join(x) for x in strategies)
        self.assertIn("player_client=web_embedded", joined)
        self.assertIn("player_skip=webpage,configs", joined)
        self.assertIn("player_client=android_vr", joined)


if __name__ == "__main__":
    unittest.main()
