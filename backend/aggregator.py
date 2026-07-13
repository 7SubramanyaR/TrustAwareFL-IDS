import numpy as np
from sklearn.metrics import accuracy_score

from trust import calculate_trust, update_history


class Aggregator:

    def aggregate(self, client_results, y_test):

        print("\n========== TRUST-AWARE AGGREGATION ==========\n")

        eligible_clients = []
        trust_sum = 0

        # Calculate trust for each client
        for client in client_results:

            trust = calculate_trust(
                client["client_id"],
                client["accuracy"]
            )

            update_history(
                client["client_id"],
                trust
            )

            client["trust"] = trust

            if trust >= 0.40:
                eligible_clients.append(client)
                trust_sum += trust
            else:
                client["weight"] = 0

        # Preventing division by zero
        if trust_sum == 0:
            print("No trusted clients available!")
            return None

        print("============== CLIENT STATUS ==============\n")

        for client in client_results:

            if client["trust"] >= 0.40:
                client["weight"] = client["trust"] / trust_sum
            else:
                client["weight"] = 0

            print(f"Client {client['client_id']}")
            print(f"Accuracy : {client['accuracy']:.4f}")
            print(f"Trust    : {client['trust']:.3f}")
            print(f"Weight   : {client['weight']:.2%}")

            if client["trust"] >= 0.85:
                print("Risk     : Low 🟢")
            elif client["trust"] >= 0.60:
                print("Risk     : Medium 🟡")
            else:
                print("Risk     : High 🔴")

            if client["weight"] == 0:
                print("Status   : 🚫 Excluded from Aggregation")
            else:
                print("Status   : ✅ Participating")

            print("----------------------------------------")

        # ------------------------------
        # Trust-weighted ensemble voting
        # ------------------------------

        predictions = np.array([
            client["predictions"]
            for client in eligible_clients
        ])

        weights = np.array([
            client["weight"]
            for client in eligible_clients
        ])

        weighted_predictions = np.average(
            predictions,
            axis=0,
            weights=weights
        )

        global_predictions = (
            weighted_predictions >= 0.5
        ).astype(int)

        global_accuracy = accuracy_score(
            y_test,
            global_predictions
        )

        print("\n========== GLOBAL MODEL ==========\n")

        print(f"Global Accuracy : {global_accuracy:.4f}")
        print(f"Trusted Clients : {len(eligible_clients)}")
        print(f"Excluded Clients: {len(client_results)-len(eligible_clients)}")

        print("\n==================================\n")

        return global_accuracy