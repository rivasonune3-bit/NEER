"""
NEER Model Evaluation Pipeline
Evaluates the trained Random Forest susceptibility classifier using standard ML metrics.

Outputs:
- ml/metrics/evaluation_report.json
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    import joblib
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix, classification_report
    )
    from sklearn.model_selection import cross_val_score, StratifiedKFold
except ImportError:
    joblib = None

from ml.config.features import FEATURE_KEYS

ML_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(ML_DIR, "data", "flood_inventory_dataset.csv")
MODEL_PATH = os.path.join(ML_DIR, "models", "random_forest_v1.joblib")
METRICS_DIR = os.path.join(ML_DIR, "metrics")
REPORT_PATH = os.path.join(METRICS_DIR, "evaluation_report.json")

def evaluate_model() -> Dict[str, Any]:
    os.makedirs(METRICS_DIR, exist_ok=True)

    pending_report: Dict[str, Any] = {
        "status": "PENDING",
        "message": "Evaluation pending — verified dataset and trained model required.",
        "metrics": None
    }

    if joblib is None or not os.path.exists(MODEL_PATH) or not os.path.exists(DATA_PATH):
        print("\n==================================================================")
        print(" [NEER ML EVALUATOR] ")
        print(" STATUS: Evaluation pending — verified dataset and trained model required.")
        print("==================================================================\n")
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(pending_report, f, indent=2)
        return pending_report

    try:
        pipeline = joblib.load(MODEL_PATH)
        df = pd.read_csv(DATA_PATH)
    except Exception as e:
        pending_report["message"] = f"Evaluation failed during loading: {str(e)}"
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(pending_report, f, indent=2)
        return pending_report

    X = df[FEATURE_KEYS]
    y = df["flood_occurrence"].values

    y_pred = pipeline.predict(X)
    y_prob = pipeline.predict_proba(X)[:, 1] if hasattr(pipeline, "predict_proba") else None

    acc = accuracy_score(y, y_pred)
    prec = precision_score(y, y_pred, zero_division=0)
    rec = recall_score(y, y_pred, zero_division=0)
    f1 = f1_score(y, y_pred, zero_division=0)
    cm = confusion_matrix(y, y_pred).tolist()
    auc = float(roc_auc_score(y, y_prob)) if y_prob is not None else None

    # K-Fold Cross Validation (5-fold)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1")

    report: Dict[str, Any] = {
        "status": "EVALUATED",
        "message": "Model evaluation complete on verified dataset.",
        "model_version": "NEER-RandomForest-v1.0",
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4) if auc is not None else None,
            "confusion_matrix": cm,
            "cross_validation_5fold_f1_mean": round(float(cv_scores.mean()), 4),
            "cross_validation_5fold_f1_std": round(float(cv_scores.std()), 4)
        }
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"[NEER ML EVALUATOR] Model evaluated. Accuracy: {acc:.4f}, F1: {f1:.4f}, ROC-AUC: {auc}")
    return report

if __name__ == "__main__":
    evaluate_model()
