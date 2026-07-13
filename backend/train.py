from preprocess import preprocess_data
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

from config import MODEL_PATH


X_train, X_test, y_train, y_test = preprocess_data()

print("\nTraining Random Forest...")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print(f"\nAccuracy : {accuracy*100:.2f}%")

print("\nClassification Report")

print(classification_report(y_test, predictions))

joblib.dump(model, MODEL_PATH)

print("\nModel Saved Successfully")