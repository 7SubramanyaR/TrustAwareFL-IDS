import numpy as np
import tensorflow as tf


class FederatedClient:

    def __init__(self, client_id, trust_score=1.0):
        self.client_id = client_id
        self.trust_score = trust_score

    def train(self, model_path, X_train, y_train,
            epochs=2, batch_size=64):

        # Load latest global model
        model = tf.keras.models.load_model(model_path)

        print(f"\nClient {self.client_id} Training...")

        history = model.fit(
            X_train,
            y_train,
            epochs=epochs,
            batch_size=batch_size,
            verbose=0
        )

        loss, accuracy = model.evaluate(
            X_train,
            y_train,
            verbose=0
        )

        print(
            f"Client {self.client_id} Accuracy: "
            f"{accuracy:.4f}"
        )

        print(
            f"Client {self.client_id} Loss: "
            f"{loss:.4f}"
        )

        return model.get_weights(), accuracy, loss

    def get_trust_score(self):
        return self.trust_score

    def update_trust(self, new_score):
        self.trust_score = new_score