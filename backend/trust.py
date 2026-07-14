class TrustManager:

    def __init__(self):
        self.min_trust = 0.10
        self.max_trust = 1.00

    def update_trust(self, current_trust, local_accuracy):
        """
        Update trust score based on client's local accuracy.
        """

        if local_accuracy >= 0.95:
            current_trust += 0.03

        elif local_accuracy >= 0.90:
            current_trust += 0.01

        elif local_accuracy >= 0.80:
            pass

        else:
            current_trust -= 0.05

        current_trust = max(self.min_trust, current_trust)
        current_trust = min(self.max_trust, current_trust)

        return round(current_trust, 3)