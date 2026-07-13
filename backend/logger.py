import csv
import os

RESULTS_FILE = "results/results.csv"

os.makedirs("results", exist_ok=True)

def initialize_log():

    with open(RESULTS_FILE, "w", newline="") as file:

        writer = csv.writer(file)

        writer.writerow([
            "Round",
            "Client",
            "Accuracy",
            "Trust",
            "Weight",
            "Status"
        ])


def log_client(round_no, client):

    with open(RESULTS_FILE, "a", newline="") as file:

        writer = csv.writer(file)

        writer.writerow([
            round_no,
            client["client_id"],
            round(client["accuracy"],4),
            round(client["trust"],2),
            round(client["weight"],2),
            "Trusted" if client["trust"]>=0.5 else "Suspicious"
        ])