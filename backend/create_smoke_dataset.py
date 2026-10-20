"""
Synthetic Smoke Test Dataset Generator for TrustAwareFL-IDS.

Creates a small, clearly labeled synthetic parquet dataset matching the
UNSW-NB15 schema (34 features + 'attack_cat' + 'label').
This dataset is explicitly designed for local smoke tests, continuous integration,
and functional verification when the full UNSW-NB15 dataset has not yet been downloaded.
"""

import os
import joblib
import numpy as np
import pandas as pd
from config import BASE_DIR, FEATURE_COLUMNS_PATH

OUTPUT_FILE = os.path.join(BASE_DIR, "dataset", "synthetic_smoke_test.parquet")


def generate_smoke_dataset(num_samples=600, random_seed=42):
    np.random.seed(random_seed)

    if os.path.exists(FEATURE_COLUMNS_PATH):
        feature_columns = joblib.load(FEATURE_COLUMNS_PATH)
    else:
        feature_columns = [
            "dur", "proto", "service", "state", "spkts", "dpkts", "sbytes", "dbytes",
            "rate", "sload", "dload", "sloss", "dloss", "sinpkt", "dinpkt", "sjit",
            "djit", "swin", "stcpb", "dtcpb", "dwin", "tcprtt", "synack", "ackdat",
            "smean", "dmean", "trans_depth", "response_body_len", "ct_src_dport_ltm",
            "ct_dst_sport_ltm", "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd",
            "is_sm_ips_ports"
        ]

    data = {}

    # Protocols, services, states common in UNSW-NB15
    protocols = ["tcp", "udp", "arp", "ospf", "icmp"]
    services = ["-", "http", "dns", "smtp", "ftp", "ssh", "pop3"]
    states = ["FIN", "INT", "CON", "REQ", "RST"]

    for col in feature_columns:
        if col == "proto":
            data[col] = np.random.choice(protocols, size=num_samples)
        elif col == "service":
            data[col] = np.random.choice(services, size=num_samples)
        elif col == "state":
            data[col] = np.random.choice(states, size=num_samples)
        elif col in ["is_ftp_login", "is_sm_ips_ports"]:
            data[col] = np.random.choice([0, 1], p=[0.9, 0.1], size=num_samples)
        elif col in ["trans_depth", "ct_ftp_cmd", "ct_flw_http_mthd"]:
            data[col] = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1], size=num_samples)
        elif col in ["spkts", "dpkts", "ct_src_dport_ltm", "ct_dst_sport_ltm"]:
            data[col] = np.random.randint(1, 100, size=num_samples)
        elif col in ["sbytes", "dbytes", "sload", "dload"]:
            data[col] = np.random.uniform(100.0, 50000.0, size=num_samples)
        else:
            data[col] = np.random.uniform(0.0, 10.0, size=num_samples)

    # 50% normal (0), 50% attack (1)
    labels = np.random.choice([0, 1], size=num_samples, p=[0.5, 0.5])
    data["label"] = labels
    data["attack_cat"] = np.where(labels == 1, "Generic", "Normal")

    df = pd.DataFrame(data)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    df.to_parquet(OUTPUT_FILE, index=False)

    print("=" * 60)
    print("SYNTHETIC SMOKE TEST DATASET GENERATED")
    print("=" * 60)
    print(f"Location : {OUTPUT_FILE}")
    print(f"Samples  : {num_samples} (Normal: {sum(labels == 0)}, Attack: {sum(labels == 1)})")
    print(f"Features : {len(feature_columns)} columns + 'attack_cat' + 'label'")
    print("NOTE     : This dataset is for functional verification only.")
    print("=" * 60)

    return OUTPUT_FILE


if __name__ == "__main__":
    generate_smoke_dataset()
