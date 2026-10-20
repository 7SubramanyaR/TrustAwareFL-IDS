"""Lifecycle tests for the Flask simulation job endpoints."""

import os
import sys
import threading
import time
import unittest
from subprocess import CompletedProcess
from unittest.mock import patch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import app as app_module  # noqa: E402


class TestSimulationLifecycle(unittest.TestCase):
    def setUp(self):
        with app_module._simulation_lock:
            app_module._simulation_job.clear()
            app_module._simulation_job.update({
                "status": "idle",
                "mode": None,
                "message": "No simulation has been run in this backend process.",
                "error": None,
                "details": None,
            })
        self.client = app_module.app.test_client()

    def wait_for_status(self, expected):
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            response = self.client.get("/simulate/status")
            if response.json["status"] == expected:
                return response.json
            time.sleep(0.01)
        self.fail(f"Simulation did not reach {expected!r} before the test deadline.")

    def test_status_can_be_restored_without_relaunching_and_duplicate_is_rejected(self):
        entered = threading.Event()
        release = threading.Event()

        def slow_success(*args, **kwargs):
            entered.set()
            if not release.wait(2):
                raise RuntimeError("Test worker was not released.")
            return CompletedProcess(args[0], 0, stdout="completed", stderr="")

        with patch.object(app_module.subprocess, "run", side_effect=slow_success) as run:
            started = self.client.post("/simulate", json={"mode": "honest"})
            self.assertEqual(started.status_code, 202)
            self.assertEqual(started.json["status"], "running")
            self.assertTrue(entered.wait(1), "The background process runner did not start.")

            duplicate = self.client.post("/simulate", json={"mode": "attack"})
            self.assertEqual(duplicate.status_code, 409)
            self.assertEqual(duplicate.json["status"], "running")
            self.assertEqual(run.call_count, 1, "A duplicate request launched another process.")

            restored = self.client.get("/simulate/status")
            self.assertEqual(restored.json["status"], "running")
            self.assertEqual(restored.json["mode"], "honest")

            release.set()
            completed = self.wait_for_status("completed")
            self.assertIn("completed successfully", completed["message"])
            self.assertEqual(run.call_count, 1)

    def test_nonzero_exit_is_failed_and_retry_is_allowed_after_stop(self):
        with patch.object(
            app_module.subprocess,
            "run",
            return_value=CompletedProcess(["simulate_fl.py"], 3, stdout="", stderr="api_key=demo-secret\nmodel error"),
        ):
            started = self.client.post("/simulate", json={"mode": "attack"})
            self.assertEqual(started.status_code, 202)
            failed = self.wait_for_status("failed")

        self.assertEqual(failed["mode"], "attack")
        self.assertIn("exit code 3", failed["error"])
        self.assertIn("[REDACTED]", failed["details"])
        self.assertNotIn("demo-secret", failed["details"])

        with patch.object(
            app_module.subprocess,
            "run",
            return_value=CompletedProcess(["simulate_fl.py"], 0, stdout="", stderr=""),
        ):
            retry = self.client.post("/simulate", json={"mode": "honest"})
            self.assertEqual(retry.status_code, 202)
            completed = self.wait_for_status("completed")
        self.assertEqual(completed["mode"], "honest")

    def test_invalid_mode_does_not_start_a_process(self):
        with patch.object(app_module.subprocess, "run") as run:
            response = self.client.post("/simulate", json={"mode": "unknown"})
        self.assertEqual(response.status_code, 400)
        run.assert_not_called()
        self.assertEqual(self.client.get("/simulate/status").json["status"], "idle")


if __name__ == "__main__":
    unittest.main(verbosity=2)
