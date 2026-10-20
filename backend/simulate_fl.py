
import argparse
import csv
import os
import shutil

import numpy as np
import tensorflow as tf

from config import (
    BASE_DIR,
    DATASET_PATH,
    MODELS_DIR,
    NUM_CLIENTS,
    RANDOM_STATE,
    ROUNDS,
    TEST_SIZE,
    VAL_SIZE,
)
from preprocess import preprocess_train_val_test
from client import FederatedClient
from trust import TrustManager
from aggregator import TrustAwareAggregator


def calculate_update_similarities(base_weights, client_weights):
    """Compare each client's model update with the other clients' updates."""
    base_vector = np.concatenate(
        [np.asarray(w).ravel() for w in base_weights]
    )

    deltas = [
        np.concatenate(
            [np.asarray(w).ravel() for w in weights]
        ) - base_vector
        for weights in client_weights
    ]

    similarities = []

    for i, delta in enumerate(deltas):
        other_deltas = [
            deltas[j] for j in range(len(deltas)) if j != i
        ]

        if not other_deltas:
            similarities.append(0.5)
            continue

        reference = np.mean(other_deltas, axis=0)
        denominator = np.linalg.norm(delta) * np.linalg.norm(reference)

        if denominator < 1e-12:
            similarity = 0.5
        else:
            cosine = np.dot(delta, reference) / denominator
            cosine = float(np.clip(cosine, -1.0, 1.0))
            similarity = (cosine + 1.0) / 2.0

        similarities.append(round(float(similarity), 4))

    return similarities


def evaluate_update(model_path, weights, X_val, y_val):
    """Evaluate a client's update on the shared validation set."""
    model = tf.keras.models.load_model(model_path)
    model.set_weights(weights)

    loss, accuracy = model.evaluate(
        X_val, y_val, verbose=0
    )

    del model
    return float(accuracy), float(loss)


def evaluate_model(model_path, X, y):
    """Evaluate a saved model on the requested dataset."""
    model = tf.keras.models.load_model(model_path)
    loss, accuracy = model.evaluate(X, y, verbose=0)

    result = {
        "loss": float(loss),
        "accuracy": float(accuracy),
    }

    del model
    return result


def poison_labels(labels, rate, seed):
    """Flip a reproducible fraction of binary labels."""
    poisoned = labels.copy()
    rng = np.random.default_rng(seed)

    count = int(len(poisoned) * rate)
    if count == 0:
        return poisoned

    indices = rng.choice(
        len(poisoned), size=count, replace=False
    )
    poisoned[indices] = 1 - poisoned[indices]

    return poisoned


def write_csv(path, headers, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(
        description="Run a controlled TrustAwareFL-IDS experiment."
    )
    parser.add_argument(
        "--mode",
        choices=["honest", "attack"],
        required=True,
        help="'honest' trains all clients honestly; "
             "'attack' poisons Client 3's labels.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.40,
        help="Minimum trust score required for aggregation.",
    )
    args = parser.parse_args()

    mode = args.mode
    seed = RANDOM_STATE

    if not 0.0 <= args.threshold < 1.0:
        raise ValueError("Threshold must be between 0 and 1.")

    os.chdir(BASE_DIR)
    tf.keras.utils.set_random_seed(seed)
    np.random.seed(seed)

    initial_model_path = os.path.join(
        MODELS_DIR, "baseline_initial.keras"
    )
    mode_model_path = os.path.join(
        MODELS_DIR, f"{mode}_global.keras"
    )
    best_model_path = os.path.join(
        MODELS_DIR, f"{mode}_best.keras"
    )

    logs_dir = os.path.join(BASE_DIR, "logs")
    client_log_path = os.path.join(
        logs_dir, f"{mode}_client_metrics.csv"
    )
    round_log_path = os.path.join(
        logs_dir, f"{mode}_round_metrics.csv"
    )

    if not os.path.isfile(initial_model_path):
        raise FileNotFoundError(
            f"Initial checkpoint not found: {initial_model_path}"
        )

    if not os.path.isfile(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    if NUM_CLIENTS < 3:
        raise ValueError(
            "This experiment expects at least three clients."
        )

    # Always begin from the same initial model for fair comparison.
    shutil.copy2(initial_model_path, mode_model_path)

    print(f"\nExperiment mode: {mode.upper()}")
    print(f"Initial checkpoint: {initial_model_path}")
    print(f"Working model: {mode_model_path}")
    print(f"Trust threshold: {args.threshold:.2f}")

    (
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        scaler, encoders
    ) = preprocess_train_val_test(
        dataset_path=DATASET_PATH,
        test_size=TEST_SIZE,
        val_size=VAL_SIZE,
        random_state=seed,
    )

    print(
        f"Dataset split: train={len(X_train)}, "
        f"validation={len(X_val)}, test={len(X_test)}"
    )

    # Shuffle once so the clients receive randomized partitions.
    rng = np.random.default_rng(seed)
    indices = rng.permutation(len(X_train))
    client_indices = np.array_split(indices, NUM_CLIENTS)

    X_clients = [X_train[idx] for idx in client_indices]
    y_clients = [y_train[idx].copy() for idx in client_indices]

    if mode == "attack":
        y_clients[2] = poison_labels(
            y_clients[2], rate=0.30, seed=seed + 3
        )
        print(
            "Attack configured: Client 3 has 30% of its "
            "training labels flipped."
        )
    else:
        print("Attack configured: none; all client labels are unchanged.")

    # Initial trust scores are identical between both experiment modes.
    clients = [
        FederatedClient(i + 1, trust_score=score)
        for i, score in enumerate([0.95, 0.80, 0.60])
    ]

    trust_manager = TrustManager()
    aggregator = TrustAwareAggregator(
        min_trust=args.threshold
    )

    client_rows = []
    round_rows = []
    best_val_accuracy = -1.0

    for round_num in range(1, ROUNDS + 1):
        print(f"\n{'=' * 18} ROUND {round_num} {'=' * 18}")

        # All clients start this round from the same global checkpoint.
        base_model = tf.keras.models.load_model(mode_model_path)
        base_weights = base_model.get_weights()
        del base_model

        client_weights = []
        sample_counts = []
        client_ids = []
        validation_accuracies = []
        validation_losses = []
        training_accuracies = []
        training_losses = []

        for i, client in enumerate(clients):
            weights, train_accuracy, train_loss = client.train(
                mode_model_path,
                X_clients[i],
                y_clients[i],
                epochs=1,
                batch_size=64,
            )

            val_accuracy, val_loss = evaluate_update(
                mode_model_path, weights, X_val, y_val
            )

            client_weights.append(weights)
            sample_counts.append(len(X_clients[i]))
            client_ids.append(client.client_id)
            training_accuracies.append(train_accuracy)
            training_losses.append(train_loss)
            validation_accuracies.append(val_accuracy)
            validation_losses.append(val_loss)

        similarities = calculate_update_similarities(
            base_weights, client_weights
        )

        trust_scores = []

        for i, client in enumerate(clients):
            updated_trust = trust_manager.update_trust(
                current_trust=client.get_trust_score(),
                validation_accuracy=validation_accuracies[i],
                update_similarity=similarities[i],
                reliability=1.0,
            )
            client.update_trust(updated_trust)
            trust_scores.append(updated_trust)

            print(
                f"Client {client.client_id}: "
                f"train_acc={training_accuracies[i]:.4f}, "
                f"val_acc={validation_accuracies[i]:.4f}, "
                f"similarity={similarities[i]:.4f}, "
                f"trust={updated_trust:.3f}"
            )

            client_rows.append([
                mode,
                round_num,
                client.client_id,
                training_accuracies[i],
                training_losses[i],
                validation_accuracies[i],
                validation_losses[i],
                similarities[i],
                updated_trust,
                mode == "attack" and client.client_id == 3,
            ])

        # Aggregate only updates accepted by the trust threshold.
        result = aggregator.aggregate(
              client_weights=client_weights,
              trust_scores=trust_scores,
              sample_counts=sample_counts,
              client_ids=client_ids,
              return_details=True,
        )

        if isinstance(result, tuple) and len(result) == 2:
            aggregated_weights, audit = result
        else:
            aggregated_weights = result
            audit = {"details": "Aggregator returned no audit details."}

        print(f"Aggregation audit: {audit}")

        # Save to a temporary file before replacing the working checkpoint.
        updated_model = tf.keras.models.load_model(mode_model_path)
        updated_model.set_weights(aggregated_weights)

        temp_model_path = mode_model_path.replace(
            ".keras", "_updated.keras"
        )
        updated_model.save(temp_model_path)
        del updated_model
        os.replace(temp_model_path, mode_model_path)

        # Validation metrics choose the best checkpoint.
        val_result = evaluate_model(
            mode_model_path, X_val, y_val
        )

        round_rows.append([
            mode,
            round_num,
            val_result["accuracy"],
            val_result["loss"],
            str(audit),
        ])

        print(
            f"Global validation accuracy: "
            f"{val_result['accuracy']:.4f}"
        )

        if val_result["accuracy"] > best_val_accuracy:
            best_val_accuracy = val_result["accuracy"]
            shutil.copy2(mode_model_path, best_model_path)
            print("Saved new best checkpoint using validation accuracy.")

    write_csv(
        client_log_path,
        [
            "Mode", "Round", "Client", "TrainAccuracy", "TrainLoss",
            "ValidationAccuracy", "ValidationLoss", "Similarity",
            "Trust", "Poisoned",
        ],
        client_rows,
    )

    write_csv(
        round_log_path,
        [
            "Mode", "Round", "GlobalValidationAccuracy",
            "GlobalValidationLoss", "AggregationAudit",
        ],
        round_rows,
    )

    # The held-out test set is evaluated only once, after training.
    test_result = evaluate_model(
        best_model_path, X_test, y_test
    )

    print(f"\n{'=' * 50}")
    print(f"FINAL RESULT: {mode.upper()}")
    print(f"Best validation accuracy: {best_val_accuracy:.4f}")
    print(f"Final test accuracy:      {test_result['accuracy']:.4f}")
    print(f"Final test loss:          {test_result['loss']:.4f}")
    print(f"Best model saved: {best_model_path}")
    print(f"Client logs saved: {client_log_path}")
    print(f"Round logs saved: {round_log_path}")
    print("Note: accuracy alone does not establish attack resistance.")


if __name__ == "__main__":
    main()
