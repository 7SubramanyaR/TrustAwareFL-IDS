
import math


class TrustManager:
    def __init__(self, min_trust=0.10, max_trust=1.00):
        if not 0.0 <= min_trust < max_trust <= 1.0:
            raise ValueError("Invalid trust score bounds.")

        self.min_trust = float(min_trust)
        self.max_trust = float(max_trust)

    def update_trust(
        self,
        current_trust,
        validation_accuracy,
        update_similarity=1.0,
        reliability=1.0,
    ):
        values = {
            "current_trust": current_trust,
            "validation_accuracy": validation_accuracy,
            "update_similarity": update_similarity,
            "reliability": reliability,
        }

        for name, value in values.items():
            if (
                not isinstance(value, (int, float))
                or not math.isfinite(value)
            ):
                raise ValueError(f"{name} must be a finite number.")

            if not 0.0 <= value <= 1.0:
                raise ValueError(f"{name} must be between 0 and 1.")

        # Trust formula: validation accuracy 20%,
        # update similarity 70%, reliability 10%.
        calculated_trust = (
            0.20 * validation_accuracy
            + 0.70 * update_similarity
            + 0.10 * reliability
        )

        # React faster to suspicious update behaviour.
        updated_trust = (
            0.20 * current_trust
            + 0.80 * calculated_trust
        )

        updated_trust = max(self.min_trust, updated_trust)
        updated_trust = min(self.max_trust, updated_trust)

        return round(updated_trust, 3)
