from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


class FLClient:

    def __init__(self, client_id):

        self.client_id = client_id

        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42
        )

    def train(self, X_train, X_test, y_train, y_test):

        self.model.fit(X_train, y_train)

        predictions = self.model.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)

        return {
            "client_id": self.client_id,
            "accuracy": accuracy,
            "predictions": predictions,
            "model": self.model
        }