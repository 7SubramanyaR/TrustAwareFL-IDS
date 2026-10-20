import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Import TensorFlow before numpy/pandas/scipy on Windows to prevent OpenMP DLL initialization conflict (0x45A)
import tensorflow as tf
import joblib
import numpy as np
import pandas as pd

from config import (
    GLOBAL_MODEL_PATH,
    BEST_MODEL_PATH,
    SCALER_PATH,
    ENCODERS_PATH,
    FEATURE_COLUMNS_PATH,
)

# In-memory artifact cache (lazy loaded)
_MODEL = None
_SCALER = None
_ENCODERS = None
_FEATURE_COLUMNS = None


def load_model_artifacts(force_reload=False):
    """Load and validate all model artifacts before publishing the cache."""
    global _MODEL, _SCALER, _ENCODERS, _FEATURE_COLUMNS

    # Required preprocessing files must always exist.
    required_files = [
        (SCALER_PATH, "scaler.pkl"),
        (ENCODERS_PATH, "encoders.pkl"),
        (FEATURE_COLUMNS_PATH, "feature_columns.pkl"),
    ]

    model_paths = [
        path
        for path in (BEST_MODEL_PATH, GLOBAL_MODEL_PATH)
        if os.path.isfile(path)
    ]

    missing_files = [
        name for path, name in required_files
        if not os.path.isfile(path)
    ]

    # Invalidate cached artifacts if any required file has disappeared.
    if not model_paths or missing_files:
        _MODEL = None
        _SCALER = None
        _ENCODERS = None
        _FEATURE_COLUMNS = None

        if not model_paths:
            return False, (
                "No trained model found. Train the model before predicting."
            )

        return False, (
            f"Required artifact '{missing_files[0]}' is missing."
        )

    # Reuse the cache only when all required files still exist.
    if (
        not force_reload
        and all(
            item is not None
            for item in (_MODEL, _SCALER, _ENCODERS, _FEATURE_COLUMNS)
        )
    ):
        return True, "Artifacts already loaded"

    # Clear old cached objects before attempting a fresh load.
    _MODEL = None
    _SCALER = None
    _ENCODERS = None
    _FEATURE_COLUMNS = None

    try:
        scaler = joblib.load(SCALER_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        feature_columns = joblib.load(FEATURE_COLUMNS_PATH)

        if not isinstance(feature_columns, (list, tuple)):
            return False, "Feature columns artifact must be a list."

        feature_columns = list(feature_columns)

        if (
            not feature_columns
            or len(set(feature_columns)) != len(feature_columns)
        ):
            return False, (
                "Feature columns are empty or contain duplicates."
            )

        if getattr(scaler, "n_features_in_", None) != len(feature_columns):
            return False, (
                "Scaler feature count does not match feature columns."
            )

    except Exception as exc:
        return False, f"Failed to load preprocessing artifacts: {exc}"

    last_error = None

    for model_path in model_paths:
        try:
            model = tf.keras.models.load_model(model_path)

            input_shape = model.input_shape
            output_shape = model.output_shape

            if (
                len(input_shape) != 3
                or input_shape[-2] != len(feature_columns)
                or input_shape[-1] != 1
            ):
                raise ValueError(
                    "Model input shape is incompatible with saved features."
                )

            if len(output_shape) != 2 or output_shape[-1] != 2:
                raise ValueError(
                    "Model must output two probabilities: Normal and Attack."
                )

            # Publish only a fully validated set of artifacts.
            _MODEL = model
            _SCALER = scaler
            _ENCODERS = encoders
            _FEATURE_COLUMNS = feature_columns

            return True, (
                f"Artifacts loaded successfully from {model_path}"
            )

        except Exception as exc:
            last_error = exc

    return False, f"Could not load a compatible model: {last_error}"

        
def is_model_ready():
    """Quick boolean check if inference can be served."""
    success, _ = load_model_artifacts()
    return success


def predict_intrusion(input_data):
    """
    Predict whether incoming network traffic is Normal or an Attack.

    Label mapping:
        Class 0: Normal traffic
        Class 1: Malicious / Intrusion traffic (Attack)

    Parameters:
        input_data (dict): Feature dictionary matching UNSW-NB15 attributes.

    Returns:
        dict: Classification result with confidence, attack probability, and status.
    """
    success, message = load_model_artifacts()
    if not success:
        return {
            "status": "error",
            "prediction": "Unavailable",
            "confidence": 0.0,
            "error": message,
            "recommendation": "Trained model not available on server. Please train a model first."
        }

    try:
        df = pd.DataFrame([input_data])

        # Fill any missing feature columns with default 0s
        for col in _FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0

        # Maintain exact column order as expected by scaler
        df = df[_FEATURE_COLUMNS].copy()

        # Encode categorical columns safely
        for column, encoder in _ENCODERS.items():
            if column in df.columns:
                val = str(df[column].iloc[0])
                if val not in encoder.classes_:
                    val = encoder.classes_[0]
                df[column] = encoder.transform([val])

        # Scale features using pre-fitted training scaler
        X = _SCALER.transform(df)

        # Reshape to 3D tensor: (1, n_features, 1) for 1D-CNN
        X_tensor = X.reshape(1, X.shape[1], 1).astype(np.float32)

        # Predict probabilities
        # Softmax returns [prob_class_0 (Normal), prob_class_1 (Attack)]
        probabilities = _MODEL.predict(X_tensor, verbose=0)[0]
        prob_normal = float(probabilities[0])
        prob_attack = float(probabilities[1])

        # Binary decision threshold at 0.5 on Attack probability (Class 1)
        if prob_attack >= 0.5:
            prediction_label = "Attack"
            confidence = round(prob_attack * 100, 2)
            recommendation = "Potential intrusion detected. Investigate immediately."
        else:
            prediction_label = "Normal"
            confidence = round(prob_normal * 100, 2)
            recommendation = "Network traffic appears safe."

        return {
            "status": "success",
            "prediction": prediction_label,
            "confidence": confidence,
            "prob_attack": round(prob_attack, 4),
            "prob_normal": round(prob_normal, 4),
            "recommendation": recommendation
        }

    except Exception as e:
        return {
            "status": "error",
            "prediction": "Error",
            "confidence": 0.0,
            "error": str(e),
            "recommendation": "An error occurred while evaluating the sample."
        }