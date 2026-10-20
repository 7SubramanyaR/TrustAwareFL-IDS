import os

# Base directory for backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Real UNSW-NB15 dataset candidate paths
REAL_DATASET_PATHS = [
    os.path.join(BASE_DIR, "dataset", "dataset.parquet"),
    os.path.join(BASE_DIR, "dataset", "UNSW_NB15_testing-set.parquet"),
    os.path.join(PROJECT_ROOT, "dataset", "dataset.parquet"),
    os.path.join(PROJECT_ROOT, "dataset", "UNSW_NB15_testing-set.parquet"),
]

# Dedicated smoke test dataset path (for local sanity testing only)
SMOKE_TEST_DATASET_PATH = os.path.join(BASE_DIR, "dataset", "synthetic_smoke_test.parquet")

def get_dataset_path(preferred_path=None, allow_smoke_fallback=False):
    """
    Returns an absolute path to the dataset.
    Prioritizes real UNSW-NB15 dataset files.
    Only falls back to synthetic smoke test dataset if explicitly allowed.
    """
    if preferred_path:
        if os.path.exists(preferred_path):
            return os.path.abspath(preferred_path)
        rel_base = os.path.join(BASE_DIR, preferred_path)
        if os.path.exists(rel_base):
            return os.path.abspath(rel_base)

    for path in REAL_DATASET_PATHS:
        if os.path.exists(path):
            return path

    if allow_smoke_fallback and os.path.exists(SMOKE_TEST_DATASET_PATH):
        return SMOKE_TEST_DATASET_PATH

    # Default to standard dataset location
    return os.path.join(BASE_DIR, "dataset", "dataset.parquet")

DATASET_PATH = get_dataset_path()

# Models directory & artifacts
MODELS_DIR = os.path.join(BASE_DIR, "models", "global")
GLOBAL_MODEL_PATH = os.path.join(MODELS_DIR, "global_model.keras")
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_global_model.keras")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
ENCODERS_PATH = os.path.join(MODELS_DIR, "encoders.pkl")
FEATURE_COLUMNS_PATH = os.path.join(MODELS_DIR, "feature_columns.pkl")
LABEL_MAPPING_PATH = os.path.join(MODELS_DIR, "label_mapping.pkl")

# Binary label mapping: 0 = Normal, 1 = Attack
LABEL_MAPPING = {0: "Normal", 1: "Attack"}

# Logs & Visualizations
LOGS_DIR = os.path.join(BASE_DIR, "logs")
TRAINING_LOG_PATH = os.path.join(LOGS_DIR, "training_log.csv")
GRAPHS_DIR = os.path.join(BASE_DIR, "graphs")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

# Ensure required runtime directories exist
os.makedirs(os.path.join(BASE_DIR, "dataset"), exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(GRAPHS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Training Hyperparameters & Defaults
VAL_SIZE = 0.15
TEST_SIZE = 0.15
RANDOM_STATE = 42
NUM_CLIENTS = 3
ROUNDS = 5