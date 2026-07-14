import csv
import os


class FLLogger:

    def __init__(self):

        os.makedirs("logs", exist_ok=True)

        self.file = "logs/training_log.csv"

        if not os.path.exists(self.file):

            with open(self.file, "w", newline="") as f:

                writer = csv.writer(f)

                writer.writerow([
                    "Round",
                    "Client",
                    "Accuracy",
                    "Loss",
                    "Trust"
                ])

    def log(self,
            round_num,
            client_id,
            accuracy,
            loss,
            trust):

        with open(self.file, "a", newline="") as f:

            writer = csv.writer(f)

            writer.writerow([
                round_num,
                client_id,
                accuracy,
                loss,
                trust
            ])