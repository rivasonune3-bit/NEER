"""
NEER Reproducible Random Forest Model Training Script
Trains a 11-GIS factor flood susceptibility model using scikit-learn.
"""

import os
import sys
import json
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    import joblib
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
except ImportError:
    joblib = None

from ml.config.features import FEATURE_KEYS, LULC_CATEGORIES, FEATURE_DEFINITIONS

ML_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(ML_DIR, "data", "flood_inventory_dataset.csv")
MODELS_DIR = os.path.join(ML_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_v1.joblib")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor_v1.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

RANDOM_SEED = 42
TEST_SIZE = 0.20
N_ESTIMATORS = 100

def train_pipeline() -> Tuple[bool, str]:
    os.makedirs(MODELS_DIR, exist_ok=True)

    if joblib is None:
        msg = "scikit-learn or joblib is not installed in the environment."
        print(f"Error: {msg}")
        return False, msg

    if not os.path.exists(DATA_PATH):
        msg = "Verified training dataset is not available."
        print(f"\n[NEER ML TRAINER] {msg}")
        print(f"Please place a valid CSV dataset at: {DATA_PATH}\n")
        return False, msg

    print(f"Loading verified training dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    required_cols = FEATURE_KEYS + ["flood_occurrence"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        msg = f"Dataset missing required columns: {missing}"
        print(f"Error: {msg}")
        return False, msg

    X = df[FEATURE_KEYS].copy()
    y = df["flood_occurrence"].values

    numeric_features = [f["key"] for f in FEATURE_DEFINITIONS if f["data_type"] == "float"]
    categorical_features = ["land_cover"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(categories=[LULC_CATEGORIES], handle_unknown="ignore"), categorical_features)
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_SEED,
        class_weight="balanced",
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])

    print("Training Random Forest Classifier on 11 GIS factors...")
    pipeline.fit(X_train, y_train)

    train_acc = pipeline.score(X_train, y_train)
    test_acc = pipeline.score(X_test, y_test)
    print(f"Training accuracy: {train_acc:.4f} | Test accuracy: {test_acc:.4f}")

    joblib.dump(pipeline, MODEL_PATH)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)

    metadata: Dict[str, Any] = {
        "model_name": "NEER Random Forest Flood Susceptibility Classifier",
        "version": "NEER-RandomForest-v1.0",
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "random_seed": RANDOM_SEED,
        "n_estimators": N_ESTIMATORS,
        "test_size": TEST_SIZE,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_accuracy": round(float(train_acc), 4),
        "test_accuracy": round(float(test_acc), 4),
        "features": FEATURE_KEYS,
        "status": "TRAINED"
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    msg = f"Model trained and saved successfully to {MODEL_PATH}"
    print(f"[NEER ML TRAINER] {msg}")
    return True, msg

if __name__ == "__main__":
    train_pipeline()
