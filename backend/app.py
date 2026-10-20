from flask import Flask, jsonify, send_file
from flask import request
from predict import predict_intrusion
from flask_cors import CORS
import pandas as pd
import os
import subprocess
import re
import sys
import threading

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "logs", "training_log.csv")
GRAPH_DIR = os.path.join(BASE_DIR, "graphs")

_simulation_lock = threading.Lock()
_simulation_job = {
    "status": "idle",
    "mode": None,
    "message": "No simulation has been run in this backend process.",
    "error": None,
    "details": None,
}


def _safe_simulation_details(stderr):
    details = (stderr or "").strip()
    for name, value in os.environ.items():
        if value and any(marker in name.lower() for marker in ("key", "secret", "password", "token", "credential")):
            details = details.replace(value, "[REDACTED]")
    details = re.sub(
        r"(?i)(api[_-]?key|secret|password|token)(\s*[:=]\s*)([^\s,;]+)",
        r"\1\2[REDACTED]",
        details,
    )
    return details[-1200:] or "The simulation process returned no error details."


def _run_simulation(mode):
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(BASE_DIR, "simulate_fl.py"), "--mode", mode],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            update = {
                "status": "completed",
                "mode": mode,
                "message": f"The {mode} simulation completed successfully.",
                "error": None,
                "details": None,
            }
        else:
            update = {
                "status": "failed",
                "mode": mode,
                "message": "The simulation process exited unsuccessfully.",
                "error": f"Simulation failed with exit code {result.returncode}.",
                "details": _safe_simulation_details(result.stderr),
            }
    except OSError as exc:
        update = {
            "status": "failed",
            "mode": mode,
            "message": "The simulation process could not be started.",
            "error": "Check the backend Python environment and simulation script.",
            "details": _safe_simulation_details(str(exc)),
        }
    except Exception:
        app.logger.exception("Unexpected error while running the simulation")
        update = {
            "status": "failed",
            "mode": mode,
            "message": "The simulation process could not be completed.",
            "error": "An unexpected backend error interrupted the simulation.",
            "details": "Check the backend logs for diagnostic details.",
        }

    with _simulation_lock:
        _simulation_job.update(update)


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
    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", "honest") if isinstance(payload, dict) else None
    if mode not in {"honest", "attack"}:
        return jsonify({"status": "error", "error": "Mode must be 'honest' or 'attack'."}), 400

    with _simulation_lock:
        if _simulation_job["status"] == "running":
            return jsonify({
                **_simulation_job,
                "error": "A simulation is already running.",
            }), 409

        _simulation_job.clear()
        _simulation_job.update({
            "status": "running",
            "mode": mode,
            "message": "Simulation started. Round-level events are not exposed.",
            "error": None,
            "details": None,
        })
        worker = threading.Thread(target=_run_simulation, args=(mode,), daemon=False)
        try:
            worker.start()
        except RuntimeError:
            _simulation_job.update({
                "status": "failed",
                "message": "The simulation worker could not be started.",
                "error": "The backend could not start a simulation worker.",
                "details": None,
            })
            return jsonify(dict(_simulation_job)), 500

    return jsonify(dict(_simulation_job)), 202


@app.route("/simulate/status", methods=["GET"])
def simulation_status():
    with _simulation_lock:
        return jsonify(dict(_simulation_job))

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({
            "status": "error",
            "prediction": "Unavailable",
            "confidence": 0.0,
            "error_type": "validation",
            "error": "Request body must be a non-empty JSON object.",
            "recommendation": "Send a valid network traffic feature object."
        }), 400

    result = predict_intrusion(data)

    if result.get("status") == "error":
        error_type = result.get("error_type")

        if error_type == "validation":
            http_status = 400
        elif error_type == "unavailable":
            http_status = 503
        else:
            http_status = 500

        return jsonify(result), http_status

    return jsonify(result), 200


@app.route("/graphs/<graph_name>")
def graph(graph_name):

    file_path = os.path.join(GRAPH_DIR, graph_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "Graph not found"}), 404

    return send_file(file_path, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)
