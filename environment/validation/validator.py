"""
NEER Environmental Observation Quality & Validation Engine
Validates missing data, timestamps, stale observations, out-of-order records, and physical bounds.
Assigns quality status: 'valid', 'warning', 'invalid', 'stale'.
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Tuple, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from environment.normalization.observation import ALLOWED_PARAMETERS, STANDARD_UNITS

# Physical thresholds for sanity check
PHYSICAL_LIMITS = {
    "rainfall": (0.0, 1000.0),            # 0 to 1000 mm/24h
    "rainfall_intensity": (0.0, 300.0),    # 0 to 300 mm/hr
    "river_level": (-10.0, 100.0),         # -10 to 100 m above gauge datum
    "streamflow": (0.0, 200000.0),        # 0 to 200,000 m3/s
    "soil_moisture": (0.0, 100.0),        # 0 to 100 %
    "temperature": (-20.0, 60.0),         # -20 to 60 degC
    "humidity": (0.0, 100.0)              # 0 to 100 %
}

STALE_THRESHOLD_MINUTES = 120  # 2 hours

def validate_observation(obs_dict: Dict[str, Any], reference_time: Optional[datetime.datetime] = None) -> Tuple[str, List[str]]:
    """
    Validates a single observation record.
    Returns:
        quality_status: 'valid' | 'warning' | 'invalid' | 'stale'
        issues: List of validation issue descriptions
    """
    issues: List[str] = []

    if reference_time is None:
        reference_time = datetime.datetime.utcnow()

    # 1. Required Fields Check
    required_keys = ["location_id", "latitude", "longitude", "parameter", "value", "unit", "observed_at", "source"]
    missing = [k for k in required_keys if k not in obs_dict or obs_dict[k] is None]
    if missing:
        issues.append(f"Missing required observation fields: {missing}")
        return "invalid", issues

    param = obs_dict["parameter"]
    val = obs_dict["value"]
    unit = obs_dict["unit"]
    obs_time_str = obs_dict["observed_at"]

    # 2. Parameter Check
    if param not in ALLOWED_PARAMETERS:
        issues.append(f"Unrecognized environmental parameter: '{param}'")
        return "invalid", issues

    # 3. Numeric & Physical Range Check
    if param != "weather_condition":
        try:
            num_val = float(val)
            limits = PHYSICAL_LIMITS.get(param)
            if limits:
                min_l, max_l = limits
                if num_val < min_l or num_val > max_l:
                    issues.append(f"Value {num_val} for {param} violates physical limits [{min_l}, {max_l}]")
                    return "invalid", issues
        except (ValueError, TypeError):
            issues.append(f"Non-numeric value '{val}' for parameter '{param}'")
            return "invalid", issues

    # 4. Timestamp & Stale Check
    try:
        cleaned_str = obs_time_str.replace("Z", "+00:00")
        obs_dt = datetime.datetime.fromisoformat(cleaned_str)
        
        if obs_dt.tzinfo is not None:
            obs_dt = obs_dt.replace(tzinfo=None)

        if obs_dt > reference_time + datetime.timedelta(minutes=5):
            issues.append(f"Future timestamp detected: {obs_time_str}")
            return "invalid", issues

        time_diff = (reference_time - obs_dt).total_seconds() / 60.0
        if time_diff > STALE_THRESHOLD_MINUTES:
            issues.append(f"Observation is stale ({round(time_diff/60.0, 1)} hours old)")
            return "stale", issues

    except (ValueError, TypeError) as e:
        issues.append(f"Invalid timestamp format '{obs_time_str}': {str(e)}")
        return "invalid", issues

    # 5. Coordinate Check
    lat, lng = obs_dict.get("latitude", 0), obs_dict.get("longitude", 0)
    if not (6.0 <= lat <= 37.5 and 68.0 <= lng <= 98.0):
        issues.append(f"Coordinates ({lat}, {lng}) outside India geographical bounds.")
        return "warning", issues

    return "valid", []

def validate_time_series(observations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validates sequence of observations for duplicates and out-of-order timestamps."""
    if not observations:
        return {"status": "EMPTY", "issues": ["No observations provided."]}

    out_of_order_count = 0
    duplicate_count = 0
    seen_timestamps = set()

    prev_dt = None
    for obs in observations:
        ts = obs.get("observed_at")
        if ts in seen_timestamps:
            duplicate_count += 1
        seen_timestamps.add(ts)

        try:
            curr_dt = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
            if prev_dt and curr_dt < prev_dt:
                out_of_order_count += 1
            prev_dt = curr_dt
        except Exception:
            pass

    return {
        "total_observations": len(observations),
        "duplicates": duplicate_count,
        "out_of_order": out_of_order_count,
        "is_clean": duplicate_count == 0 and out_of_order_count == 0
    }
