"""
NEER GIS Data Factor Dependency Mapper
Defines raw dataset dependencies for all 11 GIS factors.
Prevents calculation of derived factors until the required source dataset is available and validated.
"""

from typing import Dict, List, Any

# Map 11 GIS Factors to their required raw datasets and source IDs
GIS_FACTOR_DEPENDENCY_MAP = {
    "elevation": {
        "factor_name": "Elevation",
        "category": "Topographic",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": False,
        "calculation_rules": "Extracted directly from validated DEM raster z-values."
    },
    "slope": {
        "factor_name": "Slope",
        "category": "Topographic",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "3x3 neighborhood gradient calculation from DEM. Requires DEM."
    },
    "aspect": {
        "factor_name": "Aspect",
        "category": "Topographic",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "Compass direction of steepest slope from DEM. Requires DEM."
    },
    "profile_curvature": {
        "factor_name": "Profile Curvature",
        "category": "Topographic",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "Curvature parallel to direction of maximum slope from DEM. Requires DEM."
    },
    "plan_curvature": {
        "factor_name": "Plan Curvature",
        "category": "Topographic",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "Curvature perpendicular to direction of maximum slope from DEM. Requires DEM."
    },
    "twi": {
        "factor_name": "Topographic Wetness Index (TWI)",
        "category": "Hydrological",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "ln(a / tan(b)) where a is specific catchment area and b is slope. Requires DEM."
    },
    "spi": {
        "factor_name": "Stream Power Index (SPI)",
        "category": "Hydrological",
        "required_dataset_type": "raster",
        "primary_source_id": "src-dem-copernicus-30m",
        "parent_raw_dataset": "Digital Elevation Model (DEM)",
        "derived": True,
        "calculation_rules": "a * tan(b) measuring erosive power of flowing water. Requires DEM."
    },
    "distance_to_river": {
        "factor_name": "Distance to River",
        "category": "Hydrological",
        "required_dataset_type": "vector",
        "primary_source_id": "src-hydro-osm-waterways",
        "parent_raw_dataset": "River Vector Hydrography Network",
        "derived": True,
        "calculation_rules": "Euclidean Euclidean/geodesic distance to nearest river polygon/line. Requires River Network."
    },
    "distance_to_stream": {
        "factor_name": "Distance to Stream",
        "category": "Hydrological",
        "required_dataset_type": "vector",
        "primary_source_id": "src-hydro-osm-waterways",
        "parent_raw_dataset": "Stream Vector Hydrography Network",
        "derived": True,
        "calculation_rules": "Euclidean/geodesic distance to nearest stream segment. Requires Stream Network."
    },
    "distance_to_road": {
        "factor_name": "Distance to Road",
        "category": "Infrastructure",
        "required_dataset_type": "vector",
        "primary_source_id": "src-trans-osm-roads",
        "parent_raw_dataset": "Road Network Vector Dataset",
        "derived": True,
        "calculation_rules": "Euclidean/geodesic distance to nearest road centerline. Requires Road Network."
    },
    "land_cover": {
        "factor_name": "Land Cover (LULC)",
        "category": "Environmental",
        "required_dataset_type": "raster",
        "primary_source_id": "src-lulc-isro-bhuvan",
        "parent_raw_dataset": "LULC Land Use Classification Layer",
        "derived": False,
        "calculation_rules": "Categorical extraction from validated LULC raster/vector layer. Requires LULC Dataset."
    }
}

class FactorDependencyChecker:
    @staticmethod
    def check_factor_readiness(available_dataset_sources: List[str], processed_dir: str = "gis/data/processed/") -> Dict[str, Dict[str, Any]]:
        """
        Check 11-factor readiness based on connected raw dataset sources and derived processed output verification.
        """
        import os
        results = {}
        
        factor_file_map = {
            "elevation": "elevation.tif",
            "slope": "slope.tif",
            "aspect": "aspect.tif",
            "profile_curvature": "profileCurvature.tif",
            "plan_curvature": "planCurvature.tif",
            "twi": "twi.tif",
            "spi": "spi.tif",
            "distance_to_river": "distToRiver.tif",
            "distance_to_stream": "distToStream.tif",
            "distance_to_road": "distToRoad.tif",
            "land_cover": "lulc.tif"
        }

        for factor_key, dep in GIS_FACTOR_DEPENDENCY_MAP.items():
            primary_src = dep["primary_source_id"]
            is_connected = primary_src in available_dataset_sources
            
            expected_filename = factor_file_map.get(factor_key, f"{factor_key}.tif")
            output_path = os.path.join(processed_dir, expected_filename)
            output_verified = os.path.exists(output_path) and os.path.getsize(output_path) > 0

            status_str = "READY" if is_connected else "MISSING_SOURCE"
            proc_status = "COMPLETED" if output_verified else "AWAITING_PROCESSING"

            msg = (
                f"Source '{dep['parent_raw_dataset']}' connected ({proc_status})."
                if is_connected
                else f"Source dataset '{dep['parent_raw_dataset']}' ({primary_src}) not connected — DATA UNAVAILABLE."
            )

            results[factor_key] = {
                "factor_name": dep["factor_name"],
                "category": dep["category"],
                "parent_dataset": dep["parent_raw_dataset"],
                "primary_source_id": primary_src,
                "status": status_str,
                "processing_status": proc_status,
                "raw_source_connected": is_connected,
                "output_verified": output_verified,
                "output_file": output_path if output_verified else None,
                "message": msg
            }
        return results

    @staticmethod
    def can_calculate_all_11(available_dataset_sources: List[str], processed_dir: str = "gis/data/processed/") -> bool:
        readiness = FactorDependencyChecker.check_factor_readiness(available_dataset_sources, processed_dir)
        return all(item["raw_source_connected"] for item in readiness.values())
