"""No live media, gateway, or upload calls are allowed in these tests."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import types
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location('cloud_worker_under_test', ROOT / 'youtube-shorts-cloud/worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
from youtube_shorts_cloud.worker_policy import youtube_client_strategies


class MediaHoldTests(unittest.TestCase):
    def test_no_extraction_client_fallbacks(self):
        self.assertEqual(youtube_client_strategies(), [])

    def test_process_does_not_claim_or_retry(self):
        with patch.object(worker, 'gateway', return_value={'clip': None}) as gateway, patch.object(worker, 'ensure_runtime_packages') as packages:
            self.assertFalse(worker.process_one())
        gateway.assert_not_called()
        packages.assert_not_called()

    def test_batch_keeps_queue_untouched_and_releases_lock(self):
        with patch.object(worker, 'gateway', return_value={'clip': None}) as gateway:
            worker.run_batch()
        gateway.assert_not_called()
        self.assertFalse(worker._work_lock.locked())
        self.assertEqual(worker._last_run['processed'], 0)

    def test_direct_download_is_blocked_before_media_tools(self):
        fake_ffmpeg = types.SimpleNamespace(get_ffmpeg_exe=Mock(return_value='ffmpeg'))
        with patch.dict(sys.modules, {'imageio_ffmpeg': fake_ffmpeg}), patch.object(worker.subprocess, 'run', return_value=types.SimpleNamespace(returncode=1, stderr='blocked', stdout='')) as run:
            with self.assertRaisesRegex(RuntimeError, 'SOURCE_UNAVAILABLE'):
                worker.download_section({'start_ms': 0, 'end_ms': 30000, 'youtube_video_id': 'unused'}, str(ROOT / 'out.mp4'))
        run.assert_not_called()
        fake_ffmpeg.get_ffmpeg_exe.assert_not_called()

    def test_startup_does_not_kick_media_job(self):
        with patch.object(worker, 'GATEWAY_URL', 'https://unused.invalid'), patch.object(worker, 'WORKER_TOKEN', 'not-a-real-secret'), patch.object(worker, 'WAKE_TOKEN', 'not-a-real-secret'), patch.object(worker, 'kick') as kick, patch.object(worker, 'ThreadingHTTPServer'):
            worker.main()
        kick.assert_not_called()

    def test_authorized_wake_reports_blocker_without_starting(self):
        handler = object.__new__(worker.Handler)
        handler.path = '/work'
        handler.headers = {'x-wake-token': 'test-only'}
        handler._json = Mock()
        with patch.object(worker, 'WAKE_TOKEN', 'test-only'), patch.object(worker, 'kick') as kick:
            handler.do_POST()
        kick.assert_not_called()
        payload, status = handler._json.call_args.args
        self.assertEqual(status, 503)
        self.assertFalse(payload['accepted'])
        self.assertEqual(payload['code'], 'SOURCE_UNAVAILABLE')

    def test_unauthorized_wake_remains_denied(self):
        handler = object.__new__(worker.Handler)
        handler.path = '/work'
        handler.headers = {'x-wake-token': 'wrong'}
        handler._json = Mock()
        with patch.object(worker, 'WAKE_TOKEN', 'test-only'), patch.object(worker, 'kick') as kick:
            handler.do_POST()
        self.assertEqual(handler._json.call_args.args[1], 401)
        kick.assert_not_called()

    def test_health_does_not_disclose_raw_errors(self):
        handler = object.__new__(worker.Handler)
        handler.path = '/health'
        handler._json = Mock()
        with patch.dict(worker._last_run, {'last_error': 'private-signed-url-or-token'}):
            handler.do_GET()
            payload = json.loads(json.dumps(handler._json.call_args.args[0]))
        self.assertNotIn('private-signed-url-or-token', json.dumps(payload))
        self.assertTrue(payload['ok'])
        self.assertFalse(payload['ready'])
        self.assertEqual(payload['media_fetch'], 'blocked')
        self.assertEqual(payload['revision'], '20261007-source-hold-v1')

    def test_runtime_installer_does_not_run_during_hold(self):
        with patch.object(worker.subprocess, 'check_call') as run:
            with self.assertRaisesRegex(RuntimeError, 'SOURCE_UNAVAILABLE'):
                worker.ensure_runtime_packages()
        run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
