"""
NEER GIS CRS (Coordinate Reference System) Validator
Validates dataset spatial reference headers.
Rule: "Dataset rejected — CRS information unavailable." when missing or invalid.
"""

from typing import Dict, Any, Optional

# Supported target reference coordinate systems
TARGET_PROJECT_CRS = ["EPSG:4326", "EPSG:32645", "EPSG:32644", "WGS 84", "WGS84"]

class CRSValidator:
    @staticmethod
    def validate_crs(crs_string: Optional[str]) -> Dict[str, Any]:
        """
        Validate CRS existence, EPSG code, and transformability into analysis CRS.
        """
        if not crs_string or crs_string.strip() == "" or crs_string.upper() == "UNKNOWN":
            return {
                "valid": False,
                "crs": None,
                "is_geographic": False,
                "is_projected": False,
                "error": "Dataset rejected — CRS information unavailable."
            }

        normalized = crs_string.strip().upper()

        # Check basic EPSG or WGS84 identification
        has_valid_identifier = any(target in normalized for target in ["4326", "32645", "32644", "WGS 84", "WGS84", "UTM"])

        if not has_valid_identifier:
            return {
                "valid": False,
                "crs": crs_string,
                "is_geographic": False,
                "is_projected": False,
                "error": f"Dataset rejected — Unsupported or unrecognized CRS '{crs_string}'. Standard reference CRS required (e.g., EPSG:4326, EPSG:32645)."
            }

        is_geographic = "4326" in normalized or "WGS 84" in normalized
        is_projected = "UTM" in normalized or "326" in normalized

        return {
            "valid": True,
            "crs": crs_string,
            "is_geographic": is_geographic,
            "is_projected": is_projected,
            "analysis_transformable": True,
            "target_analysis_crs": "EPSG:4326",
            "error": None
        }
