import os
import numpy as np
import tensorflow as tf

from config import (
    BASE_DIR,
    DATASET_PATH,
    RANDOM_STATE,
    TEST_SIZE,
    VAL_SIZE,
)
from model import build_model
from preprocess import preprocess_train_val_test

os.chdir(BASE_DIR)
tf.keras.utils.set_random_seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

print("Preparing consistent train/validation/test splits...")
(
    X_train, X_val, X_test,
    y_train, y_val, y_test,
    scaler, encoders
) = preprocess_train_val_test(
    dataset_path=DATASET_PATH,
    test_size=TEST_SIZE,
    val_size=VAL_SIZE,
    random_state=RANDOM_STATE,
)

print("Building a fresh CNN-BiLSTM model...")
model = build_model((X_train.shape[1], X_train.shape[2]))

output_path = os.path.join(
    BASE_DIR, "models", "global", "baseline_initial.keras"
)
os.makedirs(os.path.dirname(output_path), exist_ok=True)
model.save(output_path)

print(f"Fresh initial model saved to: {output_path}")
print("This is an untrained initialization checkpoint, not a trained baseline.")
print(f"Train samples: {len(X_train)}")
print(f"Validation samples: {len(X_val)}")
print(f"Test samples: {len(X_test)}")
