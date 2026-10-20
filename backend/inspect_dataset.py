import os
import pandas as pd
from config import get_dataset_path

dataset_path = get_dataset_path()

if not os.path.exists(dataset_path):
    print("=" * 50)
    print("DATASET NOT FOUND")
    print("=" * 50)
    print(f"Target location: {dataset_path}")
    print("Please place 'dataset.parquet' in 'backend/dataset/' or run 'python backend/create_smoke_dataset.py'.")
    exit(1)

print(f"Inspecting dataset: {dataset_path}\n")

df = pd.read_parquet(dataset_path)

print("=" * 50)
print("Dataset Shape")
print("=" * 50)
print(df.shape)

print("\n" + "=" * 50)
print("Columns")
print("=" * 50)
print(df.columns.tolist())

print("\n" + "=" * 50)
print("Class Distribution")
print("=" * 50)
if "label" in df.columns:
    print(df["label"].value_counts())
else:
    print("No 'label' column found.")

print("\n" + "=" * 50)
print("First Five Rows")
print("=" * 50)
print(df.head())

print("\n" + "=" * 50)
print("Missing Values Summary")
print("=" * 50)
nulls = df.isnull().sum()
print(nulls[nulls > 0] if nulls.sum() > 0 else "No missing values.")