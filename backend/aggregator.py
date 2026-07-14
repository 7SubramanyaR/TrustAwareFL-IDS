import numpy as np
import tensorflow as tf


class TrustAwareAggregator:

    def __init__(self):
        pass

    def aggregate(self, client_weights, trust_scores):
        """
        Trust-weighted Federated Averaging (FedAvg)

        client_weights : List of model weights from each client
        trust_scores   : Corresponding trust score for each client

        Returns:
            Aggregated global weights
        """

        trust_scores = np.array(trust_scores, dtype=np.float32)
        trust_scores = trust_scores / np.sum(trust_scores)

        aggregated_weights = []

        # Iterate through every layer
        for layer in range(len(client_weights[0])):

            layer_weights = np.zeros_like(client_weights[0][layer])

            for client in range(len(client_weights)):
                layer_weights += (
                    trust_scores[client]
                    * client_weights[client][layer]
                )

            aggregated_weights.append(layer_weights)

        return aggregated_weights

    def update_global_model(
        self,
        model_path,
        aggregated_weights,
        save_path
    ):
        """
        Loads current global model,
        replaces weights,
        saves updated model.
        """

        model = tf.keras.models.load_model(model_path)

        model.set_weights(aggregated_weights)

        model.save(save_path)

        print("\nGlobal Model Updated Successfully!")