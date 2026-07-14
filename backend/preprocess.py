import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


def preprocess_data(dataset_path):
    """
    Preprocess the UNSW-NB15 dataset for CNN + BiLSTM.
    """

    # -----------------------------
    # Load Dataset
    # -----------------------------
    df = pd.read_parquet(dataset_path)

    print("Dataset Loaded Successfully!")
    print(df.shape)

    # -----------------------------
    # Separate Features and Labels
    # -----------------------------
    X = df.drop(columns=["label", "attack_cat"])
    y = df["label"]

    # -----------------------------
    # Encode Categorical Columns
    # -----------------------------
    categorical_columns = X.select_dtypes(include=["object", "category"]).columns

    label_encoders = {}

    for col in categorical_columns:
        encoder = LabelEncoder()
        X[col] = encoder.fit_transform(X[col].astype(str))
        label_encoders[col] = encoder

    # -----------------------------
    # Normalize Features
    # -----------------------------
    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)

    # -----------------------------
    # Train Test Split
    # -----------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # -----------------------------
    # Convert to NumPy
    # -----------------------------
    X_train = np.array(X_train)
    X_test = np.array(X_test)

    y_train = np.array(y_train)
    y_test = np.array(y_test)

    # -----------------------------
    # Reshape for CNN
    # -----------------------------
    X_train = X_train.reshape(
        X_train.shape[0],
        X_train.shape[1],
        1
    )

    X_test = X_test.reshape(
        X_test.shape[0],
        X_test.shape[1],
        1
    )

    print("\nPreprocessing Complete!\n")

    print("Training Shape :", X_train.shape)
    print("Testing Shape  :", X_test.shape)

    return (
        X_train,
        X_test,
        y_train,
        y_test,
        scaler,
        label_encoders
    )