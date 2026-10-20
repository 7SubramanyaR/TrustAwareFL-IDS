"""
test_predict.py — Focused assertions for the TrustAwareFL-IDS prediction pipeline.

Tests cover:
    1.  Successful prediction returns expected keys and status.
    2.  prob_attack and prob_normal are numeric, finite, and in [0, 1].
    3.  The two probabilities sum to ≈ 1 within floating-point tolerance.
    4.  Predicted class is consistent with the documented decision threshold
        (prob_attack >= 0.5 → "Attack"; prob_attack < 0.5 → "Normal").
    5.  Confidence and label agree with probabilities and the documented
        label mapping (Class 0 = Normal, Class 1 = Attack).
    6.  Missing model artifacts produce the documented error response rather
        than an unhandled exception.  Real artifact files are NOT modified;
        os.path.exists is patched via unittest.mock for test isolation.
    7.  All assertions include clear failure messages.
"""

import math
import os
import sys
import unittest
from unittest.mock import patch

# Ensure backend package is importable regardless of working directory.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Set TF env flag BEFORE importing predict so the module-level side-effect fires.
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from predict import predict_intrusion, is_model_ready, load_model_artifacts  # noqa: E402

# ---------------------------------------------------------------------------
# Shared sample — a realistic-looking network flow from the UNSW-NB15 schema.
# All 34 feature columns are present; no leakage columns (label / attack_cat).
# ---------------------------------------------------------------------------
SAMPLE_FLOW = {
    "dur": 0.12,
    "proto": "tcp",
    "service": "http",
    "state": "FIN",
    "spkts": 12,
    "dpkts": 15,
    "sbytes": 1200,
    "dbytes": 2500,
    "rate": 35.0,
    "sload": 140.0,
    "dload": 210.0,
    "sloss": 0,
    "dloss": 0,
    "sinpkt": 15.0,
    "dinpkt": 17.0,
    "sjit": 0.0,
    "djit": 0.0,
    "swin": 255,
    "stcpb": 100,
    "dtcpb": 120,
    "dwin": 255,
    "tcprtt": 0.2,
    "synack": 0.05,
    "ackdat": 0.04,
    "smean": 120,
    "dmean": 145,
    "trans_depth": 1,
    "response_body_len": 512,
    "ct_src_dport_ltm": 2,
    "ct_dst_sport_ltm": 3,
    "is_ftp_login": 0,
    "ct_ftp_cmd": 0,
    "ct_flw_http_mthd": 1,
    "is_sm_ips_ports": 0,
}

# Decision threshold documented in predict.py line 129.
ATTACK_THRESHOLD = 0.5

# Tolerance for floating-point probability-sum check.
PROB_SUM_TOLERANCE = 1e-4


class TestPredictIntrusion(unittest.TestCase):
    """Tests for predict_intrusion() when model artifacts are available."""

    @classmethod
    def setUpClass(cls):
        """
        Load artifacts once for the whole class.
        Skips all tests in this class if the model is not ready, with a
        clear explanation so the test runner does not report a false failure.
        """
        ready = is_model_ready()
        if not ready:
            raise unittest.SkipTest(
                "Model artifacts are not available (run 'python backend/train.py' first). "
                "Skipping model-dependent tests."
            )
        # Run a single prediction and cache the result for reuse.
        cls.result = predict_intrusion(SAMPLE_FLOW)

    # ------------------------------------------------------------------
    # Test 1 — Expected keys and valid status
    # ------------------------------------------------------------------
    def test_1_expected_keys_and_status(self):
        """Successful prediction must return 'success' status and all required keys."""
        required_keys = {"status", "prediction", "confidence", "prob_attack", "prob_normal", "recommendation"}

        self.assertEqual(
            self.result["status"],
            "success",
            msg=f"Expected status='success' but got status={self.result.get('status')!r}. "
                f"Full response: {self.result}",
        )

        missing = required_keys - self.result.keys()
        self.assertFalse(
            missing,
            msg=f"Response is missing required keys: {missing}. Full response: {self.result}",
        )

        self.assertIn(
            self.result["prediction"],
            ("Normal", "Attack"),
            msg=f"prediction must be 'Normal' or 'Attack', got {self.result['prediction']!r}",
        )

    # ------------------------------------------------------------------
    # Test 2 — prob_attack and prob_normal are numeric, finite, and in [0, 1]
    # ------------------------------------------------------------------
    def test_2_probability_bounds(self):
        """prob_attack and prob_normal must be numeric, finite, and in [0, 1]."""
        for key in ("prob_attack", "prob_normal"):
            value = self.result[key]

            self.assertIsInstance(
                value,
                (int, float),
                msg=f"'{key}' must be numeric, got {type(value).__name__}: {value!r}",
            )

            self.assertTrue(
                math.isfinite(value),
                msg=f"'{key}' must be finite, got {value!r}",
            )

            self.assertGreaterEqual(
                value,
                0.0,
                msg=f"'{key}' must be >= 0.0, got {value!r}",
            )

            self.assertLessEqual(
                value,
                1.0,
                msg=f"'{key}' must be <= 1.0, got {value!r}",
            )

    # ------------------------------------------------------------------
    # Test 3 — prob_attack + prob_normal ≈ 1
    # ------------------------------------------------------------------
    def test_3_probabilities_sum_to_one(self):
        """prob_attack and prob_normal must sum to approximately 1 (within 1e-4)."""
        total = self.result["prob_attack"] + self.result["prob_normal"]
        self.assertAlmostEqual(
            total,
            1.0,
            delta=PROB_SUM_TOLERANCE,
            msg=(
                f"prob_attack ({self.result['prob_attack']}) + "
                f"prob_normal ({self.result['prob_normal']}) = {total:.6f}, "
                f"expected ≈ 1.0 (tolerance {PROB_SUM_TOLERANCE})"
            ),
        )

    # ------------------------------------------------------------------
    # Test 4 — Predicted class is consistent with the documented threshold
    # ------------------------------------------------------------------
    def test_4_class_consistent_with_threshold(self):
        """
        Documented decision rule (predict.py line 129):
            prob_attack >= 0.5  →  prediction = "Attack"
            prob_attack <  0.5  →  prediction = "Normal"
        """
        prob_attack = self.result["prob_attack"]
        prediction = self.result["prediction"]

        if prob_attack >= ATTACK_THRESHOLD:
            self.assertEqual(
                prediction,
                "Attack",
                msg=(
                    f"prob_attack={prob_attack:.4f} is >= threshold {ATTACK_THRESHOLD}, "
                    f"so prediction must be 'Attack', got {prediction!r}"
                ),
            )
        else:
            self.assertEqual(
                prediction,
                "Normal",
                msg=(
                    f"prob_attack={prob_attack:.4f} is < threshold {ATTACK_THRESHOLD}, "
                    f"so prediction must be 'Normal', got {prediction!r}"
                ),
            )

    # ------------------------------------------------------------------
    # Test 5 — Confidence and label agree with probabilities and LABEL_MAPPING
    # ------------------------------------------------------------------
    def test_5_confidence_and_label_agreement(self):
        """
        Documented label mapping: Class 0 = Normal, Class 1 = Attack.
        Confidence is the percentage of the winning class probability,
        rounded to 2 decimal places (predict.py lines 131, 135).
        """
        prediction = self.result["prediction"]
        confidence = self.result["confidence"]
        prob_attack = self.result["prob_attack"]
        prob_normal = self.result["prob_normal"]

        # -- Label mapping check --
        if prob_attack >= ATTACK_THRESHOLD:
            expected_label = "Attack"
            expected_confidence = round(prob_attack * 100, 2)
        else:
            expected_label = "Normal"
            expected_confidence = round(prob_normal * 100, 2)

        self.assertEqual(
            prediction,
            expected_label,
            msg=(
                f"prediction={prediction!r} does not match label mapping for "
                f"prob_attack={prob_attack:.4f}. Expected {expected_label!r}."
            ),
        )

        # Confidence is rounded to 2 d.p. before storage, so exact equality is valid.
        self.assertEqual(
            confidence,
            expected_confidence,
            msg=(
                f"confidence={confidence} does not match expected {expected_confidence} "
                f"(derived from {'prob_attack' if prediction == 'Attack' else 'prob_normal'}"
                f"={prob_attack if prediction == 'Attack' else prob_normal:.4f} × 100, "
                f"rounded to 2 d.p.)"
            ),
        )

        # -- Sanity: confidence must itself be in [0, 100] --
        self.assertGreaterEqual(
            confidence,
            0.0,
            msg=f"confidence must be >= 0.0, got {confidence}",
        )
        self.assertLessEqual(
            confidence,
            100.0,
            msg=f"confidence must be <= 100.0, got {confidence}",
        )


class TestMissingArtifacts(unittest.TestCase):
    """
    Tests that missing model artifacts produce the documented error response
    rather than an unhandled exception.

    Strategy: patch os.path.exists (inside the predict module's namespace) to
    return False for all paths, which triggers the "no model found" branch in
    load_model_artifacts().  Real artifact files are NOT deleted or modified.
    """

    def _call_predict_with_no_artifacts(self):
        """
        Force-reload the in-memory artifact cache to None, then patch
        os.path.exists so every file-existence check returns False, and
        call predict_intrusion().
        """
        import predict as predict_module

        # Clear the module-level artifact cache so load_model_artifacts()
        # does not short-circuit via the "already loaded" guard.
        original_model = predict_module._MODEL
        original_scaler = predict_module._SCALER
        original_encoders = predict_module._ENCODERS
        original_feature_columns = predict_module._FEATURE_COLUMNS

        predict_module._MODEL = None
        predict_module._SCALER = None
        predict_module._ENCODERS = None
        predict_module._FEATURE_COLUMNS = None

        try:
            # Patch os.path.exists inside the predict module namespace only.
            with patch("predict.os.path.isfile", return_value=False):
                result = predict_intrusion(SAMPLE_FLOW)
        finally:
            # Always restore real cache so other tests still work.
            predict_module._MODEL = original_model
            predict_module._SCALER = original_scaler
            predict_module._ENCODERS = original_encoders
            predict_module._FEATURE_COLUMNS = original_feature_columns

        return result

    # ------------------------------------------------------------------
    # Test 6 — Missing artifacts produce a documented error response
    # ------------------------------------------------------------------
    def test_6_missing_artifacts_return_error_response(self):
        """
        When no model artifact is found, predict_intrusion() must return
        the documented error dict (predict.py lines 89-95) rather than
        raising an unhandled exception.
        """
        result = self._call_predict_with_no_artifacts()

        # Must return a dict, not raise
        self.assertIsInstance(
            result,
            dict,
            msg=f"Expected a dict error response, got {type(result).__name__}",
        )

        self.assertEqual(
            result.get("status"),
            "error",
            msg=(
                f"When artifacts are missing, status must be 'error', "
                f"got {result.get('status')!r}. Full response: {result}"
            ),
        )

        self.assertEqual(
            result.get("prediction"),
            "Unavailable",
            msg=(
                f"When artifacts are missing, prediction must be 'Unavailable', "
                f"got {result.get('prediction')!r}. Full response: {result}"
            ),
        )

        self.assertIn(
            "error",
            result,
            msg=f"Error response must contain an 'error' key with a description. Got: {result}",
        )

        error_msg = result["error"]
        self.assertIsInstance(
            error_msg,
            str,
            msg=f"'error' value must be a string description, got {type(error_msg).__name__}",
        )
        self.assertGreater(
            len(error_msg.strip()),
            0,
            msg="'error' message must not be empty",
        )

        self.assertIn(
            "recommendation",
            result,
            msg=f"Error response must contain a 'recommendation' key. Got: {result}",
        )

        # confidence must be the documented 0.0 sentinel
        self.assertEqual(
            result.get("confidence"),
            0.0,
            msg=(
                f"When artifacts are missing, confidence must be 0.0, "
                f"got {result.get('confidence')!r}"
            ),
        )


# ---------------------------------------------------------------------------
# Entry point — run as a script or via unittest discovery.
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("TESTING PREDICTION PIPELINE")
    print("=" * 60)
    unittest.main(verbosity=2)
