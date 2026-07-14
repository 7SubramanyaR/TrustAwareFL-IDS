import os
import shutil
import numpy as np
import tensorflow as tf

from trust import TrustManager
from preprocess import preprocess_data
from client import FederatedClient
from aggregator import TrustAwareAggregator
from logger import FLLogger


# ==========================================================
# Helper Function
# ==========================================================
def make_client_malicious(labels, corruption_rate=0.30):
    """
    Flip a percentage of labels to simulate a malicious client.
    """

    corrupted = labels.copy()

    n = len(corrupted)
    num_flip = int(n * corruption_rate)

    indices = np.random.choice(
        n,
        num_flip,
        replace=False
    )

    corrupted[indices] = 1 - corrupted[indices]

    return corrupted


# ==========================================================
# Configuration
# ==========================================================
DATASET_PATH = "dataset/dataset.parquet"

MODEL_PATH = "models/global/global_model.keras"
BEST_MODEL_PATH = "models/global/best_global_model.keras"

NUM_CLIENTS = 3
ROUNDS = 5


# ==========================================================
# Load Dataset
# ==========================================================
X_train, X_test, y_train, y_test, scaler, encoders = preprocess_data(
    DATASET_PATH
)


# ==========================================================
# Split Dataset
# ==========================================================
X_clients = np.array_split(X_train, NUM_CLIENTS)
y_clients = np.array_split(y_train, NUM_CLIENTS)

print("\nInjecting malicious behaviour into Client 3...\n")

y_clients[2] = make_client_malicious(
    y_clients[2],
    corruption_rate=0.30
)


# ==========================================================
# Create Clients
# ==========================================================
clients = [
    FederatedClient(1, 0.95),
    FederatedClient(2, 0.80),
    FederatedClient(3, 0.60),
]


# ==========================================================
# Initialize Components
# ==========================================================
aggregator = TrustAwareAggregator()

trust_manager = TrustManager()

logger = FLLogger()

best_accuracy = 0.0


# ==========================================================
# Federated Learning
# ==========================================================
for round_num in range(ROUNDS):

    print("\n" + "=" * 60)
    print(f"FEDERATED ROUND {round_num + 1}")
    print("=" * 60)

    client_weights = []
    trust_scores = []

    # ------------------------------------------------------
    # Local Client Training
    # ------------------------------------------------------
    for i, client in enumerate(clients):

        weights, accuracy, loss = client.train(
            MODEL_PATH,
            X_clients[i],
            y_clients[i],
            epochs=1
        )

        # --------------------------
        # Update Trust
        # --------------------------
        new_trust = trust_manager.update_trust(
            client.get_trust_score(),
            accuracy
        )

        client.update_trust(new_trust)

        client_weights.append(weights)
        trust_scores.append(new_trust)

        status = "Honest"

        if client.client_id == 3:
            status = "Malicious"

        print("\n----------------------------")
        print(f"Client {client.client_id} ({status})")
        print("----------------------------")
        print(f"Accuracy : {accuracy:.4f}")
        print(f"Loss     : {loss:.4f}")
        print(f"Trust    : {new_trust:.3f}")

        # --------------------------
        # Log Results
        # --------------------------
        logger.log(
            round_num + 1,
            client.client_id,
            accuracy,
            loss,
            new_trust
        )

    # ------------------------------------------------------
    # Aggregate Client Models
    # ------------------------------------------------------
    global_weights = aggregator.aggregate(
        client_weights,
        trust_scores
    )

    aggregator.update_global_model(
        MODEL_PATH,
        global_weights,
        MODEL_PATH
    )

    # ------------------------------------------------------
    # Evaluate Global Model
    # ------------------------------------------------------
    model = tf.keras.models.load_model(MODEL_PATH)

    global_loss, global_accuracy = model.evaluate(
        X_test,
        y_test,
        verbose=0
    )

    print("\n================================")
    print("GLOBAL MODEL")
    print("================================")
    print(f"Accuracy : {global_accuracy:.4f}")
    print(f"Loss     : {global_loss:.4f}")

    # ------------------------------------------------------
    # Save Best Model
    # ------------------------------------------------------
    if global_accuracy > best_accuracy:

        best_accuracy = global_accuracy

        shutil.copy(
            MODEL_PATH,
            BEST_MODEL_PATH
        )

        print("\nBest Global Model Updated!")

    # ------------------------------------------------------
    # Print Trust Scores
    # ------------------------------------------------------
    print("\nCurrent Trust Scores")

    for client in clients:
        print(
            f"Client {client.client_id} : {client.get_trust_score():.3f}"
        )


print("\n" + "=" * 60)
print("FEDERATED LEARNING COMPLETED")
print("=" * 60)

print(f"\nBest Global Accuracy : {best_accuracy:.4f}")

print("\nBest model saved at:")
print(BEST_MODEL_PATH)