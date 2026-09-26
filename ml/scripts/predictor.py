"""
NEER Flood Susceptibility Predictor Engine & Explainability Module
Provides inference, input validation, and feature importance calculations for 11 GIS factors.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    import joblib
except ImportError:
    joblib = None

from ml.config.features import (
    validate_input_features, FEATURE_DEFINITIONS, FEATURE_KEYS
)

ML_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(ML_DIR, "models", "random_forest_v1.joblib")
METADATA_PATH = os.path.join(ML_DIR, "models", "model_metadata.json")

EXPLAINABILITY_DISCLAIMER = (
    "Feature importance indicates the relative statistical contribution of each GIS factor "
    "to the model prediction. It represents model feature sensitivity, not direct physical causation."
)

class FloodSusceptibilityPredictor:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline = None
        self.model_version = "NEER-RandomForest-v1.0-UNLOADED"
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        if joblib is None or not os.path.exists(self.model_path):
            self.is_loaded = False
            return

        try:
            self.pipeline = joblib.load(self.model_path)
            self.is_loaded = True
            
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self.model_version = meta.get("version", "NEER-RandomForest-v1.0")
            else:
                self.model_version = "NEER-RandomForest-v1.0"
        except Exception as e:
            print(f"Error loading ML model from {self.model_path}: {e}")
            self.is_loaded = False

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict flood susceptibility score (0-100) and risk category from 11 GIS factors.
        """
        is_valid, missing, invalid = validate_input_features(features)

        if not is_valid:
            return {
                "status": "INVALID_INPUT" if invalid else "UNAVAILABLE",
                "message": "Incomplete or invalid GIS factors provided.",
                "is_valid_input": False,
                "missing_features": missing,
                "invalid_features": invalid,
                "susceptibility_score": None,
                "risk_category": None,
                "model_version": self.model_version
            }

        if not self.is_loaded or self.pipeline is None:
            return {
                "status": "MODEL_UNAVAILABLE",
                "message": "Verified trained model artifact is not loaded. Training required with verified dataset.",
                "is_valid_input": True,
                "missing_features": [],
                "invalid_features": [],
                "susceptibility_score": None,
                "risk_category": None,
                "model_version": self.model_version,
                "explainability": EXPLAINABILITY_DISCLAIMER
            }

        try:
            df_in = pd.DataFrame([features])[FEATURE_KEYS]
            
            probs = self.pipeline.predict_proba(df_in)[0]
            flood_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            score = round(min(99.0, max(1.0, flood_prob * 100.0)), 2)

            if score >= 85.0:
                risk_cat = "CRITICAL"
            elif score >= 70.0:
                risk_cat = "HIGH"
            elif score >= 45.0:
                risk_cat = "MODERATE"
            else:
                risk_cat = "LOW"

            feature_importances = self.get_feature_importances()

            return {
                "status": "SUCCESS",
                "message": "Flood susceptibility calculated successfully.",
                "is_valid_input": True,
                "missing_features": [],
                "invalid_features": [],
                "susceptibility_score": score,
                "risk_category": risk_cat,
                "confidence": round(float(max(probs) * 100.0), 2),
                "model_version": self.model_version,
                "feature_importances": feature_importances,
                "explainability": EXPLAINABILITY_DISCLAIMER
            }

        except Exception as e:
            return {
                "status": "INTERNAL_ERROR",
                "message": f"Inference processing failed: {str(e)}",
                "is_valid_input": True,
                "missing_features": [],
                "invalid_features": [str(e)],
                "susceptibility_score": None,
                "risk_category": None,
                "model_version": self.model_version
            }

    def get_feature_importances(self) -> List[Dict[str, Any]]:
        """Extracts feature importances if Random Forest model is available."""
        if not self.is_loaded or self.pipeline is None:
            return []

        try:
            clf = self.pipeline.named_steps["classifier"]
            raw_importances = clf.feature_importances_
            
            preprocessor = self.pipeline.named_steps["preprocessor"]
            feature_names_out = preprocessor.get_feature_names_out()

            factor_importance_map: Dict[str, float] = {k: 0.0 for k in FEATURE_KEYS}

            for name, imp in zip(feature_names_out, raw_importances):
                clean_name = name.split("__")[-1]
                matched_key = None
                for key in FEATURE_KEYS:
                    if clean_name.startswith(key):
                        matched_key = key
                        break
                if matched_key:
                    factor_importance_map[matched_key] += float(imp)
                else:
                    factor_importance_map["land_cover"] += float(imp)

            total = sum(factor_importance_map.values()) or 1.0
            
            result = []
            for feat_def in FEATURE_DEFINITIONS:
                k = feat_def["key"]
                pct = round((factor_importance_map.get(k, 0.0) / total) * 100.0, 2)
                result.append({
                    "key": k,
                    "name": feat_def["name"],
                    "importance_pct": pct,
                    "unit": feat_def["unit"]
                })

            result.sort(key=lambda x: x["importance_pct"], reverse=True)
            return result

        except Exception as e:
            print(f"Error computing feature importances: {e}")
            return []

_predictor_instance: Optional[FloodSusceptibilityPredictor] = None

def get_predictor() -> FloodSusceptibilityPredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = FloodSusceptibilityPredictor()
    return _predictor_instance
