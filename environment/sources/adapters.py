"""
NEER External Environmental Data Source Adapters
Provides modular adapter interfaces for external hydro-meteorological data feeds.
Handles external data connections (IMD precipitation, CWC river gauges, Soil Saturation telemetry).
"""

from typing import Dict, Any, List, Optional
import datetime

class BaseSourceAdapter:
    def __init__(self, source_name: str, parameter: str):
        self.source_name = source_name
        self.parameter = parameter
        self.is_connected = False

    def fetch_latest(self, location_id: str, lat: float, lng: float) -> Dict[str, Any]:
        """Fetches latest observation from external adapter."""
        return {
            "status": "UNCONNECTED",
            "message": f"External data source '{self.source_name}' not connected.",
            "source": self.source_name,
            "parameter": self.parameter,
            "observation": None
        }

class RainfallSourceAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(source_name="IMD-Automatic-Weather-Station", parameter="rainfall")

class RiverLevelSourceAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(source_name="CWC-River-Gauge-Telemetry", parameter="river_level")

class StreamflowSourceAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(source_name="CWC-Streamflow-Discharge", parameter="streamflow")

class SoilMoistureSourceAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(source_name="ISRO-Soil-Moisture-Telemetry", parameter="soil_moisture")

class WeatherSourceAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(source_name="IMD-Atmospheric-Observation", parameter="weather")

class DataSourceRegistry:
    def __init__(self):
        self.adapters: Dict[str, BaseSourceAdapter] = {
            "rainfall": RainfallSourceAdapter(),
            "river_level": RiverLevelSourceAdapter(),
            "streamflow": StreamflowSourceAdapter(),
            "soil_moisture": SoilMoistureSourceAdapter(),
            "weather": WeatherSourceAdapter()
        }

    def get_source_health(self) -> List[Dict[str, Any]]:
        return [
            {
                "parameter": param,
                "source": adapter.source_name,
                "is_connected": adapter.is_connected,
                "status_text": "External data source not connected." if not adapter.is_connected else "Connected"
            }
            for param, adapter in self.adapters.items()
        ]

_registry_instance: Optional[DataSourceRegistry] = None

def get_source_registry() -> DataSourceRegistry:
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = DataSourceRegistry()
    return _registry_instance
