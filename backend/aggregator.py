
import numpy as np
import tensorflow as tf


class TrustAwareAggregator:
    def __init__(self, min_trust=0.40):
        if not 0.0 <= min_trust <= 1.0:
            raise ValueError("min_trust must be between 0 and 1.")

        self.min_trust = float(min_trust)

    def aggregate(
        self,
        client_weights,
        trust_scores,
        sample_counts=None,
        client_ids=None,
        return_details=False,
    ):
        """Aggregate accepted client model weights using trust-weighted FedAvg."""

        if not client_weights:
            raise ValueError("No client model updates were provided.")

        if len(client_weights) != len(trust_scores):
            raise ValueError(
                "The number of client updates must match the trust scores."
            )

        num_clients = len(client_weights)

        if sample_counts is None:
            sample_counts = [1] * num_clients

        if client_ids is None:
            client_ids = list(range(1, num_clients + 1))

        if not (
            len(sample_counts) == len(client_ids) == num_clients
        ):
            raise ValueError(
                "Client IDs and sample counts must match the client updates."
            )

        trusts = np.asarray(trust_scores, dtype=np.float64)
        counts = np.asarray(sample_counts, dtype=np.float64)

        if not np.all(np.isfinite(trusts)):
            raise ValueError("Trust scores must be finite.")

        if np.any(trusts < 0.0) or np.any(trusts > 1.0):
            raise ValueError("Trust scores must be between 0 and 1.")

        if not np.all(np.isfinite(counts)) or np.any(counts <= 0):
            raise ValueError("Sample counts must be finite and positive.")

        # Accept clients meeting the configured trust threshold.
        accepted = [
            i for i, score in enumerate(trusts)
            if score >= self.min_trust
        ]

        if not accepted:
            raise ValueError(
                "Aggregation aborted: no clients meet the trust threshold."
            )

        # Verify every client's update has the same model structure.
        reference = client_weights[accepted[0]]

        for i, weights in enumerate(client_weights):
            if len(weights) != len(reference):
                raise ValueError(
                    f"Client {client_ids[i]} has a mismatched model structure."
                )

            for layer_idx, (weight, ref_weight) in enumerate(
                zip(weights, reference)
            ):
                if np.shape(weight) != np.shape(ref_weight):
                    raise ValueError(
                        f"Client {client_ids[i]} has an incompatible "
                        f"weight shape in layer {layer_idx}."
                    )

                if not np.all(np.isfinite(weight)):
                    raise ValueError(
                        f"Client {client_ids[i]} has non-finite weights."
                    )

        # Trust-weighted FedAvg: trust × number of local training samples.
        raw_weights = np.array(
            [trusts[i] * counts[i] for i in accepted],
            dtype=np.float64,
        )
        normalized_weights = raw_weights / raw_weights.sum()

        aggregated_weights = []

        for layer_idx in range(len(reference)):
            layer = np.zeros_like(
                np.asarray(reference[layer_idx]),
                dtype=np.float64,
            )

            for client_idx, aggregation_weight in zip(
                accepted, normalized_weights
            ):
                layer += (
                    aggregation_weight
                    * np.asarray(client_weights[client_idx][layer_idx])
                )

            aggregated_weights.append(
                layer.astype(np.asarray(reference[layer_idx]).dtype)
            )

        details = {
            "min_trust": self.min_trust,
            "accepted_clients": [
                client_ids[i] for i in accepted
            ],
            "rejected_clients": [
                client_ids[i]
                for i in range(num_clients)
                if i not in accepted
            ],
            "weights": {
                str(client_ids[i]): round(float(weight), 6)
                for i, weight in zip(accepted, normalized_weights)
            },
        }

        if return_details:
            return aggregated_weights, details

        return aggregated_weights

    def update_global_model(
        self,
        model_path,
        aggregated_weights,
        save_path,
    ):
        """Load a global model, apply aggregated weights, and save it."""

        model = tf.keras.models.load_model(model_path)
        model.set_weights(aggregated_weights)
        model.save(save_path)

        print("\nGlobal model updated successfully.")
