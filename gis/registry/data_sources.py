"""
NEER GIS Central Data-Source Registry
Tracks external and internal data sources with provenance, metadata, and connection status.
Strict zero-fabricated-data policy: Unconfigured URLs default to 'Source URL not configured.'
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class DataSource:
    source_id: str
    source_name: str
    provider: str
    dataset_name: str
    data_type: str  # 'raster', 'vector', 'telemetry', 'grid'
    geographic_coverage: str
    spatial_resolution: str
    temporal_resolution: str
    format: str
    access_method: str  # 'REST_API', 'WMS_WFS', 'DIRECT_DOWNLOAD', 'LOCAL_FILE'
    source_url: str
    license_info: str
    last_verified: Optional[str]
    status: str  # 'connected', 'available', 'awaiting_connection', 'unavailable', 'validation_required'

class DataSourceRegistry:
    def __init__(self):
        self._sources: Dict[str, DataSource] = {}
        self._bootstrap_sources()

    def _bootstrap_sources(self):
        """Bootstrap grounded data source definitions for India Flood Monitoring."""
        sources = [
            DataSource(
                source_id="src-dem-copernicus-30m",
                source_name="Copernicus DEM GLO-30",
                provider="European Space Agency (ESA) / Copernicus",
                dataset_name="Copernicus Digital Elevation Model 30m",
                data_type="raster",
                geographic_coverage="India National / Regional",
                spatial_resolution="30m x 30m",
                temporal_resolution="Static (2026 Reference)",
                format="GeoTIFF",
                access_method="REST_API",
                source_url="Source URL not configured.",
                license_info="Copernicus Open Access License",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-lulc-isro-bhuvan",
                source_name="ISRO Bhuvan LULC 10m",
                provider="National Remote Sensing Centre (NRSC) / ISRO",
                dataset_name="Bhuvan Land Use Land Cover Map",
                data_type="raster",
                geographic_coverage="India National",
                spatial_resolution="10m x 10m",
                temporal_resolution="Annual Update",
                format="GeoTIFF / GeoPackage",
                access_method="WMS_WFS",
                source_url="Source URL not configured.",
                license_info="Government of India Open Data",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-hydro-osm-waterways",
                source_name="OpenStreetMap India Hydrography",
                provider="OpenStreetMap Contributors / Humanitarian OpenStreetMap",
                dataset_name="India River & Stream Vector Network",
                data_type="vector",
                geographic_coverage="India National",
                spatial_resolution="Vector Lines & Polygons",
                temporal_resolution="Continuous Open Contribution",
                format="GeoJSON / Shapefile",
                access_method="DIRECT_DOWNLOAD",
                source_url="Source URL not configured.",
                license_info="Open Database License (ODbL)",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-trans-osm-roads",
                source_name="OpenStreetMap India Transport Network",
                provider="OpenStreetMap Contributors",
                dataset_name="India Road Network Vectors",
                data_type="vector",
                geographic_coverage="India National",
                spatial_resolution="Vector Lines",
                temporal_resolution="Continuous",
                format="Shapefile / GeoPackage",
                access_method="DIRECT_DOWNLOAD",
                source_url="Source URL not configured.",
                license_info="Open Database License (ODbL)",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-gauge-cwc-telemetry",
                source_name="CWC Hydro-Meteorological Gauge Network",
                provider="Central Water Commission (CWC), Ministry of Jal Shakti",
                dataset_name="River Water Level & Reservoir Storage Telemetry",
                data_type="telemetry",
                geographic_coverage="Major River Basins (Brahmaputra, Ganga, Mahanadi, Godavari, Krishna, Kerala Basins)",
                spatial_resolution="Point Station Sensor Network",
                temporal_resolution="Hourly / 15-min Telemetry",
                format="CSV / JSON API",
                access_method="REST_API",
                source_url="Source URL not configured.",
                license_info="Central Water Commission Public Portal",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-rain-imd-gridded",
                source_name="IMD High-Resolution Gridded Rainfall",
                provider="India Meteorological Department (IMD)",
                dataset_name="IMD 0.25° x 0.25° Daily Gridded Rainfall",
                data_type="grid",
                geographic_coverage="India Subcontinent",
                spatial_resolution="25km x 25km (0.25°)",
                temporal_resolution="Daily / 3-Hourly",
                format="NetCDF / GeoTIFF",
                access_method="DIRECT_DOWNLOAD",
                source_url="Source URL not configured.",
                license_info="IMD Open Data Policy",
                last_verified=None,
                status="awaiting_connection"
            ),
            DataSource(
                source_id="src-admin-soi-gadm",
                source_name="Survey of India / GADM Spatial Admin Boundaries",
                provider="Survey of India / GADM Project",
                dataset_name="India State, District, Block & Village Boundaries",
                data_type="vector",
                geographic_coverage="India National (States/Districts/Blocks/Villages)",
                spatial_resolution="Vector Polygons (1:50,000)",
                temporal_resolution="2026 Admin Boundary Reference",
                format="GeoPackage / GeoJSON",
                access_method="LOCAL_FILE",
                source_url="Source URL not configured.",
                license_info="Official Administrative Reference",
                last_verified=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                status="available"
            )
        ]

        for src in sources:
            self._sources[src.source_id] = src

    def register_source(self, source: DataSource) -> DataSource:
        if not source.source_url or source.source_url.strip() == "":
            source.source_url = "Source URL not configured."
        self._sources[source.source_id] = source
        return source

    def get_source(self, source_id: str) -> Optional[DataSource]:
        return self._sources.get(source_id)

    def list_sources(self, status_filter: Optional[str] = None) -> List[DataSource]:
        if status_filter:
            return [s for s in self._sources.values() if s.status == status_filter]
        return list(self._sources.values())

    def update_source_status(self, source_id: str, status: str, last_verified: Optional[str] = None) -> bool:
        if source_id in self._sources:
            self._sources[source_id].status = status
            if last_verified:
                self._sources[source_id].last_verified = last_verified
            else:
                self._sources[source_id].last_verified = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            return True
        return False

_global_registry = DataSourceRegistry()

def get_data_source_registry() -> DataSourceRegistry:
    return _global_registry
