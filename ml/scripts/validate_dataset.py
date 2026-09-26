"""
NEER Flood Susceptibility Dataset Validation Script
Validates training datasets against structural, scientific, and spatial constraints.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ml.config.features import FEATURE_DEFINITIONS, FEATURE_KEYS

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
METRICS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "metrics")
DATASET_PATH = os.path.join(DATA_DIR, "flood_inventory_dataset.csv")
REPORT_PATH = os.path.join(METRICS_DIR, "dataset_validation_report.json")

# Geographical Bounding Box for India (Approx 6°N - 37.5°N, 68°E - 98°E)
INDIA_BOUNDS = {
    "min_lat": 6.0,
    "max_lat": 37.5,
    "min_lng": 68.0,
    "max_lng": 98.0
}

def validate_dataset() -> Dict[str, Any]:
    os.makedirs(METRICS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    report: Dict[str, Any] = {
        "status": "UNAVAILABLE",
        "message": "Verified training dataset is not available.",
        "dataset_path": DATASET_PATH,
        "is_valid": False,
        "checks": {}
    }

    if not os.path.exists(DATASET_PATH):
        print("\n=======================================================")
        print(" [NEER ML DATASET VALIDATOR] ")
        print(" STATUS: Verified training dataset is not available.")
        print(f" Expected location: {DATASET_PATH}")
        print("=======================================================\n")
        
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        return report

    try:
        df = pd.read_csv(DATASET_PATH)
    except Exception as e:
        report["message"] = f"Failed to read dataset file: {str(e)}"
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        return report

    row_count, col_count = df.shape
    report["total_records"] = row_count
    report["total_columns"] = col_count

    # 1. Required Columns Check
    required_cols = FEATURE_KEYS + ["latitude", "longitude", "flood_occurrence"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    
    report["checks"]["required_columns"] = {
        "passed": len(missing_cols) == 0,
        "missing_columns": missing_cols
    }

    if missing_cols:
        report["message"] = f"Dataset is missing required columns: {missing_cols}"
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        return report

    # 2. Missing Values Check
    null_counts = df[required_cols].isnull().sum().to_dict()
    total_nulls = sum(null_counts.values())
    report["checks"]["missing_values"] = {
        "passed": total_nulls == 0,
        "total_null_cells": int(total_nulls),
        "column_null_counts": {k: int(v) for k, v in null_counts.items()}
    }

    # 3. Duplicate Rows & Coordinate Collisions
    dup_rows = int(df.duplicated(subset=FEATURE_KEYS).sum())
    dup_coords = int(df.duplicated(subset=["latitude", "longitude"]).sum())
    report["checks"]["duplicates"] = {
        "passed": dup_rows == 0 and dup_coords == 0,
        "duplicate_feature_rows": dup_rows,
        "duplicate_coordinates": dup_coords
    }

    # 4. Coordinate Validity Check
    invalid_lats = df[(df["latitude"] < INDIA_BOUNDS["min_lat"]) | (df["latitude"] > INDIA_BOUNDS["max_lat"])]
    invalid_lngs = df[(df["longitude"] < INDIA_BOUNDS["min_lng"]) | (df["longitude"] > INDIA_BOUNDS["max_lng"])]
    invalid_coords_count = int(len(invalid_lats) + len(invalid_lngs))
    
    report["checks"]["spatial_bounds"] = {
        "passed": invalid_coords_count == 0,
        "invalid_coordinate_count": invalid_coords_count,
        "bounding_box": INDIA_BOUNDS
    }

    # 5. Outlier & Range Check
    range_violations = []
    for feat in FEATURE_DEFINITIONS:
        key = feat["key"]
        min_v = feat.get("min_val")
        max_v = feat.get("max_val")
        if min_v is not None and (df[key] < min_v).any():
            violating = int((df[key] < min_v).sum())
            range_violations.append(f"{feat['name']}: {violating} values below min ({min_v})")
        if max_v is not None and (df[key] > max_v).any():
            violating = int((df[key] > max_v).sum())
            range_violations.append(f"{feat['name']}: {violating} values above max ({max_v})")

    report["checks"]["range_bounds"] = {
        "passed": len(range_violations) == 0,
        "violations": range_violations
    }

    # 6. Class Imbalance Check
    class_counts = df["flood_occurrence"].value_counts().to_dict()
    total = len(df)
    class_ratios = {str(k): round(v / total, 4) for k, v in class_counts.items()}
    
    report["checks"]["class_balance"] = {
        "counts": {str(k): int(v) for k, v in class_counts.items()},
        "ratios": class_ratios,
        "is_severely_imbalanced": any(r < 0.15 for r in class_ratios.values())
    }

    # Overall Status Decision
    is_valid = (
        report["checks"]["required_columns"]["passed"] and
        report["checks"]["missing_values"]["passed"] and
        report["checks"]["spatial_bounds"]["passed"]
    )

    report["is_valid"] = is_valid
    report["status"] = "VALIDATED" if is_valid else "INVALID_DATASET"
    report["message"] = (
        "Dataset verified successfully." if is_valid else "Dataset contains structural or range errors."
    )

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Validation finished. Result: {report['status']} - {report['message']}")
    return report

if __name__ == "__main__":
    validate_dataset()
