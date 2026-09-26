"""
NEER GIS Processing Module — Point Coordinate Feature Extractor
Extracts 11 static GIS susceptibility parameters for a given Latitude and Longitude coordinate.
"""

import os
import time
import json
from typing import Dict, Any, List
from gis.processing.spatial_cache import get_spatial_cache

REQUIRED_FACTORS = [
    "elevation",
    "slope",
    "distToRiver",
    "distToStream",
    "distToRoad",
    "lulc",
    "aspect",
    "twi",
    "spi",
    "profileCurvature",
    "planCurvature"
]

def extract_gis_features(
    latitude: float,
    longitude: float,
    study_area_id: str = "INDIA_NATIONAL",
    processed_dir: str = "gis/data/processed/"
) -> Dict[str, Any]:
    """
    Extracts the 11 static GIS factor values at the target (lat, lng) location using SpatialRasterCache.
    If raster layers are missing, returns structured 'unavailable' payload.
    Does NOT invent fake GIS numbers.
    """
    start_time = time.perf_counter()
    cache = get_spatial_cache()

    # 1. Validate Coordinate Bounds
    if not (6.0 <= latitude <= 38.0 and 68.0 <= longitude <= 98.0):
        return {
            "status": "error",
            "error_code": "INVALID_COORDINATES",
            "message": f"Coordinates ({latitude}, {longitude}) are out of Indian bounds (Lat 6°-38°N, Lng 68°-98°E)."
        }

    # 2. Check presence of processed GeoTIFF rasters for all 11 factors using SpatialCache
    missing_factors: List[str] = []
    available_factors: Dict[str, float] = {}

    for factor in REQUIRED_FACTORS:
        raster_path = os.path.join(processed_dir, f"{factor}.tif")
        if not os.path.exists(raster_path):
            missing_factors.append(factor)
        else:
            val, _ = cache.get_factor_value(factor, raster_path, latitude, longitude)
            if val is None:
                missing_factors.append(factor)
            else:
                available_factors[factor] = float(val)

    total_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 3)

    # 3. If any required factor raster is absent, return structured 'unavailable' status
    if missing_factors:
        first_missing = missing_factors[0]
        return {
            "status": "unavailable",
            "factor": first_missing,
            "reason": "Required verified dataset is not available.",
            "study_area_id": study_area_id,
            "latitude": latitude,
            "longitude": longitude,
            "missing_factors": missing_factors,
            "available_factors_count": len(available_factors),
            "total_required": len(REQUIRED_FACTORS),
            "extraction_latency_ms": total_latency_ms,
            "data_source_status": "Source not connected — awaiting verified dataset.",
            "message": f"Verified GIS data layer '{first_missing}' is not connected. Preprocessing required for target study area."
        }

    # 4. If all 11 factors exist, return extracted vector
    return {
        "status": "available",
        "study_area_id": study_area_id,
        "latitude": latitude,
        "longitude": longitude,
        "gis_features": available_factors,
        "extraction_latency_ms": total_latency_ms,
        "extracted_at_utc": json.dumps(None) # Timestamp
    }

if __name__ == "__main__":
    # Test point in Assam
    res = extract_gis_features(26.1850, 91.7720, "st-as")
    print(json.dumps(res, indent=2))
