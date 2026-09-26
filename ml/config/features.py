"""
NEER Central 11-Factor Feature Configuration Helper
Maintains feature naming, data types, boundaries, and validation across:
- GIS Feature Extractor
- ML Training & Evaluation
- Prediction Service
- Database Schema
- Frontend Interface
"""

import json
import os
from typing import Dict, Any, List, Tuple

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "features_config.json")

def load_feature_config() -> Dict[str, Any]:
    """Loads the central JSON feature configuration."""
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Feature configuration file not found at: {CONFIG_PATH}")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

FEATURE_CONFIG = load_feature_config()
FEATURE_DEFINITIONS = FEATURE_CONFIG.get("features", [])
FEATURE_KEYS = [f["key"] for f in FEATURE_DEFINITIONS]
FEATURE_NAMES = [f["name"] for f in FEATURE_DEFINITIONS]

LULC_CATEGORIES = next(
    (f["allowed_categories"] for f in FEATURE_DEFINITIONS if f["key"] == "land_cover"),
    ["Water Body", "Wetland", "Agricultural Land", "Built-Up Area", "Forest", "Barren Land", "Grassland", "Shrubland"]
)

def validate_input_features(features: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
    """
    Validates a dictionary of 11 GIS features.
    Returns:
        is_valid: bool
        missing_features: List of missing feature keys
        invalid_features: List of error messages for out-of-bound / wrong type features
    """
    missing: List[str] = []
    invalid: List[str] = []

    for feat_def in FEATURE_DEFINITIONS:
        key = feat_def["key"]
        name = feat_def["name"]
        
        if key not in features or features[key] is None:
            missing.append(name)
            continue
            
        val = features[key]
        
        if feat_def["data_type"] == "float":
            try:
                num_val = float(val)
                min_val = feat_def.get("min_val")
                max_val = feat_def.get("max_val")
                if min_val is not None and num_val < min_val:
                    invalid.append(f"{name} value ({num_val}) is below minimum physical threshold ({min_val})")
                elif max_val is not None and num_val > max_val:
                    invalid.append(f"{name} value ({num_val}) exceeds maximum physical threshold ({max_val})")
            except (ValueError, TypeError):
                invalid.append(f"{name} must be a valid numeric value, got: {val}")

        elif feat_def["data_type"] == "string" and key == "land_cover":
            str_val = str(val).strip()
            allowed = feat_def.get("allowed_categories", LULC_CATEGORIES)
            if str_val not in allowed:
                invalid.append(f"{name} value '{str_val}' is not in allowed categories: {allowed}")

    is_valid = len(missing) == 0 and len(invalid) == 0
    return is_valid, missing, invalid
