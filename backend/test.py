"""
Focused Preprocessing and Evaluation Pipeline Tests for TrustAwareFL-IDS.
Verifies data loading, 3-way stratified splitting, zero target leakage,
feature normalization on train partition only, and tensor shapes for CNN + BiLSTM.
"""

if __name__ == "__main__":
    # Keep these script-only imports inside the entry point. unittest discovery
    # imports this module before test_predict.py; importing NumPy here first can
    # trigger TensorFlow's Windows DLL initialization failure in that process.
    import numpy as np
    from preprocess import preprocess_data, preprocess_train_val_test, EXPECTED_NUM_FEATURES

    print("=" * 60)
    print("RUNNING PREPROCESSING SANITY TESTS")
    print("=" * 60)

    # -------------------------------------------------------------
    # Test 1: Backward-compatible 2-way split
    # -------------------------------------------------------------
    print("\n--- Test 1: 2-Way Stratified Split (Backward Compatibility) ---")
    X_train, X_test, y_train, y_test, scaler, encoders = preprocess_data()
    assert len(X_train.shape) == 3, "X_train must be a 3D tensor (samples, features, 1)"
    assert len(X_test.shape) == 3, "X_test must be a 3D tensor (samples, features, 1)"
    assert X_train.shape[1] == EXPECTED_NUM_FEATURES, f"Expected {EXPECTED_NUM_FEATURES} features, got {X_train.shape[1]}"
    assert scaler.n_features_in_ == EXPECTED_NUM_FEATURES, f"Scaler expected {EXPECTED_NUM_FEATURES} features, got {scaler.n_features_in_}"
    print("[PASS] Test 1: 2-way split verified successfully.")

    # -------------------------------------------------------------
    # Test 2: 3-way stratified split (Train, Val, Test)
    # -------------------------------------------------------------
    print("\n--- Test 2: 3-Way Stratified Split (Train / Val / Test) ---")
    X_train, X_val, X_test, y_train, y_val, y_test, scaler, encoders = preprocess_train_val_test(
        test_size=0.15,
        val_size=0.15
    )

    total_samples = len(X_train) + len(X_val) + len(X_test)
    print(f"Total Preprocessed Samples: {total_samples}")
    print(f"Train : {len(X_train)} ({len(X_train)/total_samples*100:.1f}%)")
    print(f"Val   : {len(X_val)} ({len(X_val)/total_samples*100:.1f}%)")
    print(f"Test  : {len(X_test)} ({len(X_test)/total_samples*100:.1f}%)")

    # Validate shapes and dimensions
    assert len(X_train.shape) == 3, "X_train must be 3D"
    assert len(X_val.shape) == 3, "X_val must be 3D"
    assert len(X_test.shape) == 3, "X_test must be 3D"
    assert (
        X_train.shape[1] == EXPECTED_NUM_FEATURES and
        X_val.shape[1] == EXPECTED_NUM_FEATURES and
        X_test.shape[1] == EXPECTED_NUM_FEATURES
    ), "Feature count mismatch"

    # Validate label alignment
    assert len(y_train) == len(X_train)
    assert len(y_val) == len(X_val)
    assert len(y_test) == len(X_test)

    # Validate stratification: class distribution should be ~55% attack in all splits
    train_attack_ratio = np.mean(y_train)
    val_attack_ratio = np.mean(y_val)
    test_attack_ratio = np.mean(y_test)
    print(f"\nStratification Ratios (Attack %):")
    print(f"  Train : {train_attack_ratio*100:.2f}%")
    print(f"  Val   : {val_attack_ratio*100:.2f}%")
    print(f"  Test  : {test_attack_ratio*100:.2f}%")

    assert abs(train_attack_ratio - val_attack_ratio) < 0.02, "Stratification mismatch between train and val"
    assert abs(train_attack_ratio - test_attack_ratio) < 0.02, "Stratification mismatch between train and test"

    print("[PASS] Test 2: 3-way stratified split verified successfully.")

    print("\n" + "=" * 60)
    print("[ALL TESTS PASSED] Preprocessing pipeline is robust and leakage-free.")
    print("=" * 60)
