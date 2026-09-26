"""
NEER GIS Data Acquisition & Local Source Scanner
Scans data/raw/ directories for verified real geospatial datasets.
Outputs structured acquisition reports and download instructions.
Strict Zero-Fabricated-Data Policy: Does not create placeholder files or synthetic layers.
"""

import os
import json
from typing import Dict, Any, List, Optional

RAW_DATA_DIRS = {
    "dem": "data/raw/dem",
    "hydrography": "data/raw/hydrography",
    "roads": "data/raw/roads",
    "lulc": "data/raw/lulc",
    "boundaries": "data/raw/boundaries"
}

PROCESSED_DATA_DIRS = {
    "elevation": "data/processed/elevation",
    "slope": "data/processed/slope",
    "aspect": "data/processed/aspect",
    "twi": "data/processed/twi",
    "spi": "data/processed/spi",
    "profile_curvature": "data/processed/profile_curvature",
    "plan_curvature": "data/processed/plan_curvature",
    "distance_to_river": "data/processed/distance_to_river",
    "distance_to_stream": "data/processed/distance_to_stream",
    "distance_to_road": "data/processed/distance_to_road",
    "lulc": "data/processed/lulc"
}

DATASET_ACQUISITION_INSTRUCTIONS = {
    "dem": {
        "dataset_name": "Copernicus DEM GLO-30 / SRTM 30m",
        "provider": "European Space Agency (ESA) / NASA",
        "format": "GeoTIFF (.tif)",
        "target_directory": "data/raw/dem/",
        "acquisition_method": "Download 30m DEM tiles covering target area from Copernicus Open Access Hub or USGS EarthExplorer.",
        "license": "Copernicus Open Access / Public Domain"
    },
    "hydrography": {
        "dataset_name": "OpenStreetMap India Waterways / Survey of India Hydrography",
        "provider": "OpenStreetMap Contributors / SOI",
        "format": "GeoJSON (.geojson) / Shapefile (.shp bundle) / GeoPackage (.gpkg)",
        "target_directory": "data/raw/hydrography/",
        "acquisition_method": "Extract river channel and stream vector networks from Geofabrik India OSM extract or Bhuvan Portal.",
        "license": "Open Database License (ODbL) / Open Government Data"
    },
    "roads": {
        "dataset_name": "OpenStreetMap India Transportation Network",
        "provider": "OpenStreetMap Contributors",
        "format": "Shapefile (.shp) / GeoPackage (.gpkg) / GeoJSON (.geojson)",
        "target_directory": "data/raw/roads/",
        "acquisition_method": "Extract highway/road network vector lines from Geofabrik India OSM export.",
        "license": "Open Database License (ODbL)"
    },
    "lulc": {
        "dataset_name": "ISRO Bhuvan LULC / ESA WorldCover 10m",
        "provider": "NRSC ISRO / European Space Agency",
        "format": "GeoTIFF (.tif)",
        "target_directory": "data/raw/lulc/",
        "acquisition_method": "Download 10m/30m LULC land cover raster tile set from Bhuvan NRSC portal or ESA WorldCover portal.",
        "license": "Government Open Data / Creative Commons Attribution"
    }
}

class GISDataAcquisitionManager:

    @staticmethod
    def initialize_data_directories(base_dir: str = "."):
        """Ensures raw and processed data directory structure exists without creating dummy files."""
        for path in RAW_DATA_DIRS.values():
            os.makedirs(os.path.join(base_dir, path), exist_ok=True)
        for path in PROCESSED_DATA_DIRS.values():
            os.makedirs(os.path.join(base_dir, path), exist_ok=True)

    @staticmethod
    def scan_raw_datasets(base_dir: str = ".") -> Dict[str, Any]:
        """Scans local data/raw/ folders for actual geospatial files."""
        GISDataAcquisitionManager.initialize_data_directories(base_dir)
        
        found_datasets: Dict[str, List[Dict[str, Any]]] = {}
        missing_categories: List[str] = []

        valid_extensions = {".tif", ".tiff", ".geojson", ".shp", ".gpkg", ".nc"}

        for cat, rel_path in RAW_DATA_DIRS.items():
            full_dir = os.path.join(base_dir, rel_path)
            found_datasets[cat] = []
            
            if os.path.exists(full_dir):
                files = os.listdir(full_dir)
                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in valid_extensions:
                        file_path = os.path.join(full_dir, f)
                        size_bytes = os.path.getsize(file_path)
                        found_datasets[cat].append({
                            "filename": f,
                            "file_path": file_path,
                            "size_bytes": size_bytes,
                            "extension": ext
                        })

            if len(found_datasets[cat]) == 0:
                missing_categories.append(cat)

        return {
            "status": "PARTIAL" if len(missing_categories) > 0 and len(missing_categories) < len(RAW_DATA_DIRS) else ("CONNECTED" if len(missing_categories) == 0 else "NO_DATA"),
            "found_datasets": found_datasets,
            "missing_categories": missing_categories,
            "acquisition_instructions": {cat: DATASET_ACQUISITION_INSTRUCTIONS[cat] for cat in missing_categories if cat in DATASET_ACQUISITION_INSTRUCTIONS}
        }

if __name__ == "__main__":
    manager = GISDataAcquisitionManager()
    res = manager.scan_raw_datasets()
    print(json.dumps(res, indent=2))
