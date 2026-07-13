import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from config import DATASET_PATH, TEST_SIZE, RANDOM_STATE


def preprocess_data():

    # Load dataset
    df = pd.read_parquet(DATASET_PATH)

    print("Dataset Loaded Successfully")
    print(f"Rows : {df.shape[0]}")
    print(f"Columns : {df.shape[1]}")

    # Encode categorical columns
    encoder = LabelEncoder()

    categorical_columns = [
        "proto",
        "service",
        "state"
    ]

    for column in categorical_columns:
        df[column] = encoder.fit_transform(df[column])

    # Drop attack category
    X = df.drop(columns=["label", "attack_cat"])

    # Target
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )

    return X_train, X_test, y_train, y_test