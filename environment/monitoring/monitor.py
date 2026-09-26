"""
NEER 4-Tier Risk-State Architecture Monitoring Service
Synthesizes:
1. Static Flood Susceptibility (11 GIS factors)
2. Dynamic Environmental Condition (Rainfall, River, Streamflow, Soil)
3. Flood Trigger Status (Configured Rules Engine)
4. Overall Monitoring Status (Synthesized Operational State)
"""

import sys
import os
import datetime
from typing import Dict, Any, Optional, List

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from environment.sources.adapters import get_source_registry
from environment.validation.validator import validate_observation
from environment.triggers.trigger_engine import get_trigger_engine
from ml.scripts.predictor import get_predictor

class EnvironmentalMonitor:
    def __init__(self):
        self.registry = get_source_registry()
        self.trigger_engine = get_trigger_engine()
        self.ml_predictor = get_predictor()

    def get_location_monitoring_status(
        self,
        location_id: str,
        lat: float,
        lng: float,
        gis_factors: Optional[Dict[str, Any]] = None,
        telemetry_observations: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates 4-Tier Risk State Architecture for a location.
        """
        # Tier 1: Static Susceptibility
        if gis_factors:
            ml_res = self.ml_predictor.predict(gis_factors)
            tier_1_susceptibility = {
                "status": ml_res["status"],
                "risk_category": ml_res.get("risk_category"),
                "susceptibility_score": ml_res.get("susceptibility_score"),
                "model_version": ml_res.get("model_version"),
                "missing_gis_factors": ml_res.get("missing_features", []),
                "message": ml_res.get("message")
            }
        else:
            tier_1_susceptibility = {
                "status": "UNAVAILABLE",
                "risk_category": None,
                "susceptibility_score": None,
                "model_version": "NEER-RandomForest-v1.0",
                "missing_gis_factors": [
                    "elevation", "slope", "distance_to_river", "distance_to_stream",
                    "distance_to_road", "land_cover", "aspect", "twi", "spi",
                    "profile_curvature", "plan_curvature"
                ],
                "message": "GIS factors not provided for this point."
            }

        # Tier 2: Dynamic Environmental Condition
        if telemetry_observations:
            valid_count = 0
            stale_count = 0
            invalid_count = 0
            validated_obs = {}

            for param, obs in telemetry_observations.items():
                status, issues = validate_observation(obs)
                if status == "valid":
                    valid_count += 1
                elif status == "stale":
                    stale_count += 1
                else:
                    invalid_count += 1

                validated_obs[param] = {
                    **obs,
                    "quality_status": status,
                    "validation_issues": issues
                }

            if valid_count > 0:
                tier_2_environmental = {
                    "status": "DATA_AVAILABLE",
                    "condition": "ELEVATED" if stale_count > 0 else "NORMAL",
                    "valid_observations_count": valid_count,
                    "stale_observations_count": stale_count,
                    "invalid_observations_count": invalid_count,
                    "observations": validated_obs,
                    "data_source_notice": "Telemetry observations loaded."
                }
            else:
                tier_2_environmental = {
                    "status": "DATA_UNAVAILABLE",
                    "condition": "DATA_UNAVAILABLE",
                    "valid_observations_count": 0,
                    "stale_observations_count": stale_count,
                    "invalid_observations_count": invalid_count,
                    "observations": validated_obs,
                    "data_source_notice": "External data source not connected. Telemetry observations unavailable."
                }
        else:
            tier_2_environmental = {
                "status": "DATA_UNAVAILABLE",
                "condition": "DATA_UNAVAILABLE",
                "valid_observations_count": 0,
                "stale_observations_count": 0,
                "invalid_observations_count": 0,
                "observations": {},
                "data_source_notice": "External data source not connected."
            }

        # Tier 3: Flood Trigger Status
        trigger_res = self.trigger_engine.evaluate_observations(
            telemetry_observations or {}
        )
        tier_3_triggers = {
            "overall_trigger_status": trigger_res["overall_trigger_status"],
            "triggered_rules_count": trigger_res["triggered_rules_count"],
            "unconfigured_rules_count": trigger_res["unconfigured_rules_count"],
            "evaluations": trigger_res["evaluations"],
            "disclaimer": trigger_res["disclaimer"]
        }

        # Tier 4: Synthesized Overall Monitoring Status
        if tier_3_triggers["overall_trigger_status"] == "TRIGGERED":
            overall_status = "TRIGGERED"
        elif tier_2_environmental["status"] == "DATA_UNAVAILABLE":
            overall_status = "DATA_UNAVAILABLE"
        elif tier_1_susceptibility["risk_category"] in ["CRITICAL", "HIGH"]:
            overall_status = "ELEVATED"
        else:
            overall_status = "MONITORING"

        return {
            "location_id": location_id,
            "latitude": lat,
            "longitude": lng,
            "overall_monitoring_status": overall_status,
            "tier_1_susceptibility": tier_1_susceptibility,
            "tier_2_environmental_conditions": tier_2_environmental,
            "tier_3_trigger_status": tier_3_triggers,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }

_monitor_instance: Optional[EnvironmentalMonitor] = None

def get_environmental_monitor() -> EnvironmentalMonitor:
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = EnvironmentalMonitor()
    return _monitor_instance
