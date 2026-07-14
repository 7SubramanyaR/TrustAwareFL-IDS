from flask import Flask, jsonify, send_file
from flask import request
from predict import predict_intrusion
from flask_cors import CORS
import pandas as pd
import os
import subprocess

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "logs", "training_log.csv")
GRAPH_DIR = os.path.join(BASE_DIR, "graphs")


@app.route("/")
def home():
    return jsonify({
        "project": "Trust-Aware Federated Learning IDS",
        "version": "1.0",
        "status": "Running"
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "healthy"
    })


@app.route("/metrics")
def metrics():

    if not os.path.exists(LOG_FILE):
        return jsonify({"error": "No training log found."}), 404

    df = pd.read_csv(LOG_FILE)

    latest_round = int(df["Round"].max())

    latest = df[df["Round"] == latest_round]

    response = {
        "current_round": latest_round,
        "clients": []
    }

    global_accuracy = latest["Accuracy"].mean()
    global_loss = latest["Loss"].mean()
    best_accuracy = df.groupby("Round")["Accuracy"].mean().max()

    response["global_accuracy"] = round(float(global_accuracy), 4)
    response["global_loss"] = round(float(global_loss), 4)
    response["best_accuracy"] = round(float(best_accuracy), 4)

    for _, row in latest.iterrows():

        response["clients"].append({

            "client": int(row["Client"]),
            "accuracy": round(float(row["Accuracy"]), 4),
            "loss": round(float(row["Loss"]), 4),
            "trust": round(float(row["Trust"]), 4)

        })

    return jsonify(response)


@app.route("/simulate", methods=["POST"])
def simulate():

    subprocess.run(["python", "simulate_fl.py"])

    return jsonify({
        "message": "Simulation Completed Successfully"
    })

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    result = predict_intrusion(data)

    return jsonify(result)


@app.route("/graphs/<graph_name>")
def graph(graph_name):

    file_path = os.path.join(GRAPH_DIR, graph_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "Graph not found"}), 404

    return send_file(file_path, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)