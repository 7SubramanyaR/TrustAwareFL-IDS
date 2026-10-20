"""
Baseline Training and Evaluation Pipeline for TrustAwareFL-IDS.

Trains the CNN + BiLSTM model on the UNSW-NB15 dataset using a 3-way
stratified split (Train, Validation, Test) with early stopping based on val_loss.
Evaluates exactly once on the untouched final test split and reports comprehensive
metrics (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix).
Saves all model and preprocessing artifacts to backend/models/global/.
"""

import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import random
import joblib
import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from config import (
    DATASET_PATH,
    GLOBAL_MODEL_PATH,
    SCALER_PATH,
    ENCODERS_PATH,
    FEATURE_COLUMNS_PATH,
    LABEL_MAPPING_PATH,
    LABEL_MAPPING,
    MODELS_DIR,
    RANDOM_STATE,
    TEST_SIZE,
    VAL_SIZE,
    get_dataset_path
)
from model import build_model
from preprocess import preprocess_train_val_test

# -------------------------------------------------------------
# 1. Reproducible Random Seeds
# -------------------------------------------------------------
random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)
tf.keras.utils.set_random_seed(RANDOM_STATE)

print("=" * 70)
print("TRUSTAWAREFL-IDS: BASELINE TRAINING & EVALUATION PIPELINE")
print("=" * 70)

# -------------------------------------------------------------
# 2. Dataset Path & 3-Way Stratified Preprocessing
# -------------------------------------------------------------
dataset_path = get_dataset_path(allow_smoke_fallback=False)
print(f"Dataset Path : {dataset_path}")

if not os.path.exists(dataset_path):
    raise FileNotFoundError(
        f"Real dataset not found at '{dataset_path}'. "
        "Please ensure 'backend/dataset/dataset.parquet' is available."
    )

print("\nExecuting stratified train / validation / test preprocessing...")
(
    X_train,
    X_val,
    X_test,
    y_train,
    y_val,
    y_test,
    scaler,
    encoders
) = preprocess_train_val_test(
    dataset_path=dataset_path,
    test_size=TEST_SIZE,
    val_size=VAL_SIZE,
    random_state=RANDOM_STATE,
    allow_smoke_fallback=False
)

total_records = len(X_train) + len(X_val) + len(X_test)
print("\n" + "-" * 70)
print("SPLIT SIZES & CLASS DISTRIBUTIONS")
print("-" * 70)
print(f"Total Dataset Records : {total_records}")
print(f"Training Partition    : {len(X_train):>6} samples ({len(X_train)/total_records*100:>5.1f}%) | Normal (0): {np.sum(y_train==0):>5}, Attack (1): {np.sum(y_train==1):>5}")
print(f"Validation Partition  : {len(X_val):>6} samples ({len(X_val)/total_records*100:>5.1f}%) | Normal (0): {np.sum(y_val==0):>5}, Attack (1): {np.sum(y_val==1):>5}")
print(f"Untouched Test Split  : {len(X_test):>6} samples ({len(X_test)/total_records*100:>5.1f}%) | Normal (0): {np.sum(y_test==0):>5}, Attack (1): {np.sum(y_test==1):>5}")
print(f"Input Feature Count   : {X_train.shape[1]} channels (3D Tensor: {X_train.shape})")
print("-" * 70)

# -------------------------------------------------------------
# 3. Model Architecture & Compilation
# -------------------------------------------------------------
print("\nInstantiating CNN + BiLSTM Architecture...")
model = build_model((X_train.shape[1], X_train.shape[2]))
model.summary()

# -------------------------------------------------------------
# 4. Training with Early Stopping on Validation Loss
# -------------------------------------------------------------
epochs = 10
batch_size = 128

early_stopping = tf.keras.callbacks.EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True,
    verbose=1
)

print(f"\nStarting model training for up to {epochs} epochs (batch_size={batch_size}, early_stopping_patience=3)...")
print("NOTE: Validation loss is used strictly for early stopping. Final test split is held out untouched.")

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=epochs,
    batch_size=batch_size,
    callbacks=[early_stopping],
    verbose=1
)

# Identify best epoch based on lowest validation loss
val_losses = history.history["val_loss"]
best_epoch = int(np.argmin(val_losses)) + 1
best_val_loss = float(val_losses[best_epoch - 1])
best_val_acc = float(history.history["val_accuracy"][best_epoch - 1])

print("\n" + "=" * 70)
print(f"TRAINING COMPLETE | Best Epoch: {best_epoch}/{len(val_losses)}")
print(f"Best Validation Loss : {best_val_loss:.4f} | Validation Accuracy: {best_val_acc * 100:.2f}%")
print("=" * 70)

# -------------------------------------------------------------
# 5. Untouched Final Test Split Evaluation (Exactly Once)
# -------------------------------------------------------------
print("\n" + "=" * 70)
print("FINAL EVALUATION ON UNTOUCHED TEST SPLIT")
print("=" * 70)

raw_predictions = model.predict(X_test, batch_size=256, verbose=0)
prob_attack = raw_predictions[:, 1]
y_pred = (prob_attack >= 0.5).astype(int)

test_loss, test_acc = model.evaluate(X_test, y_test, batch_size=256, verbose=0)
test_precision = precision_score(y_test, y_pred, zero_division=0)
test_recall = recall_score(y_test, y_pred, zero_division=0)
test_f1 = f1_score(y_test, y_pred, zero_division=0)
test_roc_auc = roc_auc_score(y_test, prob_attack)
cm = confusion_matrix(y_test, y_pred)

print(f"\nTest Accuracy  : {test_acc * 100:.2f}% ({accuracy_score(y_test, y_pred):.4f})")
print(f"Test Precision : {test_precision:.4f}")
print(f"Test Recall    : {test_recall:.4f}")
print(f"Test F1-Score  : {test_f1:.4f}")
print(f"Test ROC-AUC   : {test_roc_auc:.4f}")
print(f"Test Loss      : {test_loss:.4f}")

print("\nConfusion Matrix:")
print("                 Predicted Normal (0)   Predicted Attack (1)")
print(f"Actual Normal (0)       {cm[0][0]:>10}             {cm[0][1]:>10}")
print(f"Actual Attack (1)       {cm[1][0]:>10}             {cm[1][1]:>10}")

print("\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Normal (0)", "Attack (1)"], digits=4))

# -------------------------------------------------------------
# 6. Save Model and Preprocessing Artifacts
# -------------------------------------------------------------
print("-" * 70)
print("SAVING MODEL AND ARTIFACTS")
print("-" * 70)
os.makedirs(MODELS_DIR, exist_ok=True)

model.save(GLOBAL_MODEL_PATH)
print(f"[Saved] Global Model          : {GLOBAL_MODEL_PATH}")

feature_columns = [
    "dur", "proto", "service", "state", "spkts", "dpkts", "sbytes", "dbytes",
    "rate", "sload", "dload", "sloss", "dloss", "sinpkt", "dinpkt", "sjit",
    "djit", "swin", "stcpb", "dtcpb", "dwin", "tcprtt", "synack", "ackdat",
    "smean", "dmean", "trans_depth", "response_body_len", "ct_src_dport_ltm",
    "ct_dst_sport_ltm", "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd",
    "is_sm_ips_ports"
]

joblib.dump(feature_columns, FEATURE_COLUMNS_PATH)
joblib.dump(scaler, SCALER_PATH)
joblib.dump(encoders, ENCODERS_PATH)
joblib.dump(LABEL_MAPPING, LABEL_MAPPING_PATH)

print(f"[Saved] Feature Schema ({len(feature_columns)} cols) : {FEATURE_COLUMNS_PATH}")
print(f"[Saved] Standard Scaler       : {SCALER_PATH}")
print(f"[Saved] Categorical Encoders  : {ENCODERS_PATH}")
print(f"[Saved] Binary Label Mapping  : {LABEL_MAPPING_PATH}")

print("\n" + "=" * 70)
print("[SUCCESS] Baseline pipeline executed and exported successfully!")
print("=" * 70)