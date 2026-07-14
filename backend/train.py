from preprocess import preprocess_data
from model import build_model
import joblib

import os


# -----------------------------
# Dataset Path
# -----------------------------
DATASET_PATH = "dataset/dataset.parquet"

# -----------------------------
# Load Dataset
# -----------------------------
X_train, X_test, y_train, y_test, scaler, encoders = preprocess_data(DATASET_PATH)

print("\nBuilding CNN + BiLSTM Model...\n")

# -----------------------------
# Build Model
# -----------------------------
model = build_model((X_train.shape[1], X_train.shape[2]))

model.summary()

# -----------------------------
# Train Model
# -----------------------------
history = model.fit(
    X_train,
    y_train,
    validation_data=(X_test, y_test),
    epochs=10,
    batch_size=64,
    verbose=1
)

# -----------------------------
# Evaluate
# -----------------------------
loss, accuracy = model.evaluate(X_test, y_test)

print(f"\nTest Accuracy: {accuracy*100:.2f}%")

# -----------------------------
# Save Model
# -----------------------------
os.makedirs("models/global", exist_ok=True)

model.save("models/global/global_model.keras")

feature_columns = [
    "dur",
    "proto",
    "service",
    "state",
    "spkts",
    "dpkts",
    "sbytes",
    "dbytes",
    "rate",
    "sload",
    "dload",
    "sloss",
    "dloss",
    "sinpkt",
    "dinpkt",
    "sjit",
    "djit",
    "swin",
    "stcpb",
    "dtcpb",
    "dwin",
    "tcprtt",
    "synack",
    "ackdat",
    "smean",
    "dmean",
    "trans_depth",
    "response_body_len",
    "ct_src_dport_ltm",
    "ct_dst_sport_ltm",
    "is_ftp_login",
    "ct_ftp_cmd",
    "ct_flw_http_mthd",
    "is_sm_ips_ports"
]

joblib.dump(
    feature_columns,
    "models/global/feature_columns.pkl"
)

print("Feature columns saved.")
# -----------------------------
# Save Preprocessing Objects
# -----------------------------
joblib.dump(scaler, "models/global/scaler.pkl")
joblib.dump(encoders, "models/global/encoders.pkl")

print("Scaler saved.")
print("Encoders saved.")

print("\nModel saved successfully!")
print("Location: models/global/global_model.keras")