"""
NEER Common Environmental Observation Format & Normalization Engine
"""

import sys
import os
import datetime
from typing import Dict, Any, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

ALLOWED_PARAMETERS = [
    "rainfall",
    "rainfall_intensity",
    "river_level",
    "streamflow",
    "soil_moisture",
    "temperature",
    "humidity",
    "weather_condition"
]

STANDARD_UNITS = {
    "rainfall": "mm",
    "rainfall_intensity": "mm/hr",
    "river_level": "m",
    "streamflow": "m3/s",
    "soil_moisture": "%",
    "temperature": "degC",
    "humidity": "%",
    "weather_condition": "text"
}

class EnvironmentalObservation:
    def __init__(
        self,
        location_id: str,
        latitude: float,
        longitude: float,
        parameter: str,
        value: Any,
        unit: str,
        observed_at: str,
        source: str,
        quality_status: str = "valid"
    ):
        self.location_id = location_id
        self.latitude = latitude
        self.longitude = longitude
        self.parameter = parameter
        self.value = value
        self.unit = unit
        self.observed_at = observed_at
        self.source = source
        self.quality_status = quality_status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "location_id": self.location_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "parameter": self.parameter,
            "value": self.value,
            "unit": self.unit,
            "observed_at": self.observed_at,
            "source": self.source,
            "quality_status": self.quality_status
        }

def normalize_unit(parameter: str, value: float, input_unit: str) -> tuple[float, str]:
    """Converts common non-standard units to standard SI / hydro units."""
    if parameter not in STANDARD_UNITS:
        return value, input_unit

    target_unit = STANDARD_UNITS[parameter]

    if parameter == "rainfall" and input_unit.lower() in ["inches", "in"]:
        return round(value * 25.4, 2), target_unit
    elif parameter == "temperature" and input_unit.lower() in ["degf", "f", "fahrenheit"]:
        return round((value - 32) * 5 / 9, 2), target_unit
    elif parameter == "streamflow" and input_unit.lower() in ["cfs", "ft3/s"]:
        return round(value * 0.0283168, 2), target_unit

    return value, target_unit
