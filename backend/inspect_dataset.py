import pandas as pd

# Load dataset
df = pd.read_parquet("dataset/dataset.parquet")

print("=" * 50)
print("Dataset Shape")
print("=" * 50)
print(df.shape)

print("\n" + "=" * 50)
print("Columns")
print("=" * 50)
print(df.columns.tolist())

print("\n" + "=" * 50)
print("Data Types")
print("=" * 50)
print(df.dtypes)

print("\n" + "=" * 50)
print("First Five Rows")
print("=" * 50)
print(df.head())

print("\n" + "=" * 50)
print("Missing Values")
print("=" * 50)
print(df.isnull().sum())