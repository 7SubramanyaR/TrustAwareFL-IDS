import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from config import (
    DATASET_PATH,
    TEST_SIZE,
    VAL_SIZE,
    RANDOM_STATE,
    get_dataset_path
)

EXPECTED_NUM_FEATURES = 34


def preprocess_data(
    dataset_path=None,
    test_size=TEST_SIZE,
    val_size=None,
    random_state=RANDOM_STATE,
    allow_smoke_fallback=False
):
    """
    Preprocess the UNSW-NB15 dataset for CNN + BiLSTM binary classification.

    Fits the StandardScaler and LabelEncoders strictly on the training partition
    to eliminate data leakage. Unknown categorical values in val/test are mapped
    safely to known categories.

    If val_size is None or 0:
        Returns: (X_train, X_test, y_train, y_test, scaler, label_encoders)
    If val_size > 0:
        Returns: (X_train, X_val, X_test, y_train, y_val, y_test, scaler, label_encoders)
    """
    if dataset_path is None:
        dataset_path = get_dataset_path(allow_smoke_fallback=allow_smoke_fallback)

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(
            f"Dataset not found at '{dataset_path}'.\n"
            f"Please place the UNSW-NB15 dataset file at 'backend/dataset/dataset.parquet'."
        )

    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_parquet(dataset_path)
    print(f"Dataset Loaded Successfully! Shape: {df.shape}")

    # Validate target label
    if "label" not in df.columns:
        raise ValueError("Dataset missing required binary target column 'label'.")

    # -------------------------------------------------------------
    # Prevent Target Leakage: Drop label, attack_cat, and row id
    # -------------------------------------------------------------
    drop_cols = [c for c in ["label", "attack_cat", "id"] if c in df.columns]
    X = df.drop(columns=drop_cols).copy()
    y = df["label"].astype(int).values

    # Strict target leakage assertions
    assert "label" not in X.columns, "Target leakage detected: 'label' present in feature matrix!"
    assert "attack_cat" not in X.columns, "Target leakage detected: 'attack_cat' present in feature matrix!"
    if X.shape[1] != EXPECTED_NUM_FEATURES:
        print(f"[Warning] Feature count is {X.shape[1]} (expected {EXPECTED_NUM_FEATURES}).")

    stratify_target = y if len(np.unique(y)) > 1 else None

    # -------------------------------------------------------------
    # Stratified Splitting
    # -------------------------------------------------------------
    if val_size and val_size > 0:
        # 3-way split: Train, Validation, and Test
        # Step 1: Hold out untouched final test set
        X_temp_df, X_test_df, y_temp, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify_target
        )

        # Step 2: Split remaining data into Train and Validation
        val_ratio = val_size / (1.0 - test_size)
        stratify_temp = y_temp if len(np.unique(y_temp)) > 1 else None

        X_train_df, X_val_df, y_train, y_val = train_test_split(
            X_temp_df,
            y_temp,
            test_size=val_ratio,
            random_state=random_state,
            stratify=stratify_temp
        )
    else:
        # 2-way split: Train and Test (backward compatible)
        X_train_df, X_test_df, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify_target
        )
        X_val_df, y_val = None, None

    # -------------------------------------------------------------
    # Encode Categorical Columns (Fit strictly on Train)
    # -------------------------------------------------------------
    categorical_columns = X.select_dtypes(include=["object", "category"]).columns.tolist()
    label_encoders = {}

    for col in categorical_columns:
        encoder = LabelEncoder()
        train_vals = X_train_df[col].astype(str)
        encoder.fit(train_vals)
        label_encoders[col] = encoder

        X_train_df[col] = encoder.transform(train_vals)

        known_classes = set(encoder.classes_)
        fallback = encoder.classes_[0]

        if X_val_df is not None:
            val_vals = X_val_df[col].astype(str).apply(
                lambda v: v if v in known_classes else fallback
            )
            X_val_df[col] = encoder.transform(val_vals)

        test_vals = X_test_df[col].astype(str).apply(
            lambda v: v if v in known_classes else fallback
        )
        X_test_df[col] = encoder.transform(test_vals)

    # Fill any remaining numerical NaNs
    X_train_df = X_train_df.fillna(0)
    if X_val_df is not None:
        X_val_df = X_val_df.fillna(0)
    X_test_df = X_test_df.fillna(0)

    # -------------------------------------------------------------
    # Normalize Features (Fit strictly on Train)
    # -------------------------------------------------------------
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_df)
    X_test_scaled = scaler.transform(X_test_df)

    # Reshape for 1D-CNN (samples, features, 1)
    X_train = np.array(X_train_scaled, dtype=np.float32).reshape(X_train_scaled.shape[0], X_train_scaled.shape[1], 1)
    X_test = np.array(X_test_scaled, dtype=np.float32).reshape(X_test_scaled.shape[0], X_test_scaled.shape[1], 1)
    y_train = np.array(y_train, dtype=np.int32)
    y_test = np.array(y_test, dtype=np.int32)

    if X_val_df is not None:
        X_val_scaled = scaler.transform(X_val_df)
        X_val = np.array(X_val_scaled, dtype=np.float32).reshape(X_val_scaled.shape[0], X_val_scaled.shape[1], 1)
        y_val = np.array(y_val, dtype=np.int32)

        print("\n--- Stratified Preprocessing Summary (3-Way Split) ---")
        print(f"Training Set   : {X_train.shape[0]} samples ({X_train.shape[0]/len(df)*100:.1f}%) | Normal: {np.sum(y_train==0)}, Attack: {np.sum(y_train==1)}")
        print(f"Validation Set : {X_val.shape[0]} samples ({X_val.shape[0]/len(df)*100:.1f}%) | Normal: {np.sum(y_val==0)}, Attack: {np.sum(y_val==1)}")
        print(f"Final Test Set : {X_test.shape[0]} samples ({X_test.shape[0]/len(df)*100:.1f}%) | Normal: {np.sum(y_test==0)}, Attack: {np.sum(y_test==1)}")
        print(f"Features (CNN) : {X_train.shape[1]} channels")

        return (
            X_train,
            X_val,
            X_test,
            y_train,
            y_val,
            y_test,
            scaler,
            label_encoders
        )

    print("\n--- Preprocessing Summary (2-Way Split) ---")
    print(f"Training Set : {X_train.shape[0]} samples | Normal: {np.sum(y_train==0)}, Attack: {np.sum(y_train==1)}")
    print(f"Testing Set  : {X_test.shape[0]} samples | Normal: {np.sum(y_test==0)}, Attack: {np.sum(y_test==1)}")
    print(f"Features     : {X_train.shape[1]} channels")

    return (
        X_train,
        X_test,
        y_train,
        y_test,
        scaler,
        label_encoders
    )


def preprocess_train_val_test(
    dataset_path=None,
    test_size=TEST_SIZE,
    val_size=VAL_SIZE,
    random_state=RANDOM_STATE,
    allow_smoke_fallback=False
):
    """
    Convenience function that explicitly requests the 3-way train/validation/test split.
    """
    return preprocess_data(
        dataset_path=dataset_path,
        test_size=test_size,
        val_size=val_size,
        random_state=random_state,
        allow_smoke_fallback=allow_smoke_fallback
    )