from preprocess import preprocess_data

X_train, X_test, y_train, y_test = preprocess_data()

print()

print("Training Samples :", len(X_train))
print("Testing Samples  :", len(X_test))