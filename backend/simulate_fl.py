import numpy as np

from preprocess import preprocess_data
from client import FLClient
from aggregator import Aggregator
from logger import initialize_log, log_client

NUM_CLIENTS = 4
NUM_ROUNDS = 5
MALICIOUS_CLIENT = 3

initialize_log()

X_train, X_test, y_train, y_test = preprocess_data()

# Split dataset among clients
indices = np.array_split(np.arange(len(X_train)), NUM_CLIENTS)

X_train_split = [
    X_train.iloc[idx].reset_index(drop=True)
    for idx in indices
]

y_train_split = [
    y_train.iloc[idx].reset_index(drop=True)
    for idx in indices
]

aggregator = Aggregator()

for round_no in range(1, NUM_ROUNDS + 1):

    print("\n")
    print("=" * 60)
    print(f"           FEDERATED LEARNING ROUND {round_no}")
    print("=" * 60)

    client_results = []

    for i in range(NUM_CLIENTS):

        client = FLClient(client_id=i + 1)

        X_local = X_train_split[i].copy()
        y_local = y_train_split[i].copy()

        # ---------------------------------------
        # Simulate Mirai Botnet Attack
        # ---------------------------------------

        if client.client_id == MALICIOUS_CLIENT:

            print(f"\n🚨 Client {MALICIOUS_CLIENT} infected with Mirai Botnet")

            poison_percent = min(
                0.20 + (round_no * 0.10),
                0.80
            )

            poison_count = int(
                len(y_local) * poison_percent
            )

            poison_indices = np.random.choice(
                y_local.index,
                poison_count,
                replace=False
            )

            y_local.loc[poison_indices] = (
                1 - y_local.loc[poison_indices]
            )

            print(
                f"Label Poisoning : {int(poison_percent*100)}%"
            )

        result = client.train(
            X_local,
            X_test,
            y_local,
            y_test
        )

        client_results.append(result)

    global_accuracy = aggregator.aggregate(
        client_results,
        y_test
    )

    for client in client_results:
        log_client(
            round_no,
            client
        )

print("\n")
print("=" * 60)
print(" FEDERATED LEARNING SIMULATION COMPLETED ")
print("=" * 60)
print("\nResults saved to results/results.csv")