import numpy as np
import pandas as pd
import joblib
import tensorflow as tf

# -----------------------------
# Load Saved Model
# -----------------------------
MODEL = tf.keras.models.load_model(
    "models/global/global_model.keras"
)

# -----------------------------
# Load Preprocessing Objects
# -----------------------------
SCALER = joblib.load(
    "models/global/scaler.pkl"
)

ENCODERS = joblib.load(
    "models/global/encoders.pkl"
)

FEATURE_COLUMNS = joblib.load(
    "models/global/feature_columns.pkl"
)


# -----------------------------
# Prediction Function
# -----------------------------
def predict_intrusion(input_data):
    """
    Predict whether incoming traffic is normal or malicious.

    Parameters
    ----------
    input_data : dict
        Dictionary containing all feature values.

    Returns
    -------
    dict
        Prediction result.
    """

    # -----------------------------
    # Convert to DataFrame
    # -----------------------------
    df = pd.DataFrame([input_data])

    # -----------------------------
    # Ensure Correct Feature Order
    # -----------------------------
    df = df[FEATURE_COLUMNS]

    # -----------------------------
    # Encode Categorical Columns
    # -----------------------------
    for column, encoder in ENCODERS.items():

        value = str(df[column].iloc[0])

        # Handle unseen values safely
        if value not in encoder.classes_:

            value = encoder.classes_[0]

        df[column] = encoder.transform([value])

    # -----------------------------
    # Scale Features
    # -----------------------------
    X = SCALER.transform(df)

    # -----------------------------
    # CNN Input Shape
    # -----------------------------
    X = X.reshape(
        1,
        X.shape[1],
        1
    )

    # -----------------------------
    # Predict
    # -----------------------------
    probability = float(
        MODEL.predict(
            X,
            verbose=0
        )[0][0]
    )

    prediction = 1 if probability >= 0.5 else 0

    confidence = probability if prediction == 1 else (1 - probability)

    # -----------------------------
    # Build Response
    # -----------------------------
    if prediction == 1:

        return {

            "prediction": "Attack",

            "confidence": round(confidence * 100, 2),

            "recommendation":
                "Potential intrusion detected. Investigate immediately."

        }

    return {

        "prediction": "Normal",

        "confidence": round(confidence * 100, 2),

        "recommendation":
            "Network traffic appears safe."

    }